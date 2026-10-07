import { CalendarCheck, CalendarX, ChevronRight, CircleCheck, MessageSquareWarning, Receipt, Star, Store, TicketPercent, UserX, Users, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { byNewest, findById, getCouponUsage, getReviews, isSoldOut } from '../../data/selectors'
import { useStore } from '../../hooks/useStore'
import { getCouponStatus } from '../../utils/coupons'
import { formatFullDate, formatMoney, fullName, isPast, pluralize } from '../../utils/format'
import { getNetSales, getOrderRefunded } from '../../utils/orders'
import DataTable from '../ui/DataTable'
import ImageWithFallback from '../ui/ImageWithFallback'
import SectionHeader from '../ui/SectionHeader'
import StatCard from '../ui/StatCard'
import { COUPON_EXPIRY_WARNING_DAYS, COUPON_USES_WARNING, LOW_RATING } from './adminRules'
import './AdminOverview.css'

const RECENT_ORDERS = 5
const TOP_EXPERIENCES = 5
const DAY_MS = 86400000

/** Cosas que conviene revisar, cada una con link a su sección ya filtrada. */
function getAlerts(db, experiences) {
  const soldOut = experiences.filter(isSoldOut).length
  const withoutDates = experiences.filter((experience) => !experience.upcomingCount).length
  const lowReviews = db.reviews.filter((review) => review.rating <= LOW_RATING).length
  const inactiveUsers = db.users.filter((user) => !user.active).length
  const couponsAtRisk = db.coupons.filter((coupon) => {
    const used = getCouponUsage(db, coupon)
    if (getCouponStatus(coupon, used).label !== 'Activo') return false
    const nearLimit = coupon.maxUses != null && coupon.maxUses - used <= COUPON_USES_WARNING
    const nearExpiry = new Date(coupon.validUntil).getTime() - Date.now() <= COUPON_EXPIRY_WARNING_DAYS * DAY_MS
    return nearLimit || nearExpiry
  }).length

  return [
    soldOut && { icon: Store, tone: 'danger', text: `${pluralize(soldOut, 'experiencia agotada', 'experiencias agotadas')}`, to: '/admin/experiencias?estado=agotada' },
    withoutDates && { icon: CalendarX, tone: 'warning', text: `${pluralize(withoutDates, 'experiencia', 'experiencias')} sin fechas próximas`, to: '/admin/experiencias?estado=sin-fechas' },
    lowReviews && { icon: MessageSquareWarning, tone: 'danger', text: `${pluralize(lowReviews, 'reseña', 'reseñas')} de ${LOW_RATING}★ o menos para revisar`, to: '/admin/resenas?puntuacion=baja' },
    couponsAtRisk && { icon: TicketPercent, tone: 'warning', text: `${pluralize(couponsAtRisk, 'cupón', 'cupones')} por agotarse o vencer`, to: '/admin/cupones?estado=Activo' },
    inactiveUsers && { icon: UserX, tone: 'neutral', text: `${pluralize(inactiveUsers, 'cuenta desactivada', 'cuentas desactivadas')}`, to: '/admin/usuarios?estado=inactivo' },
  ].filter(Boolean)
}

function AdminOverview() {
  const { db, experiences } = useStore()
  const upcomingBookings = db.bookings.filter((booking) => !booking.refunded && !isPast(booking.startsAt))
  const recentOrders = [...db.orders].sort(byNewest).slice(0, RECENT_ORDERS)
  const reviews = getReviews(db)
  const averageRating = reviews.length ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1) : '—'
  const alerts = getAlerts(db, experiences)

  const topExperiences = experiences
    .map((experience) => ({
      ...experience,
      sold: db.bookings
        .filter((booking) => booking.experienceId === experience.id && !booking.refunded)
        .reduce((sum, booking) => sum + booking.unitPrice * booking.quantity, 0),
    }))
    .filter((experience) => experience.sold > 0)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, TOP_EXPERIENCES)

  return (
    <div className="stack admin-overview">
      <div className="stat-grid">
        <StatCard icon={Wallet} label="Ventas netas" value={formatMoney(getNetSales(db.orders, db.bookings))} hint="Cobrado menos reembolsos" />
        <StatCard icon={Receipt} label="Órdenes" value={db.orders.length} />
        <StatCard icon={CalendarCheck} label="Reservas próximas" value={upcomingBookings.length} />
        <StatCard icon={Users} label="Usuarios activos" value={db.users.filter((user) => user.active).length} />
        <StatCard icon={Store} label="Experiencias" value={experiences.length} />
        <StatCard icon={Star} label="Puntuación promedio" value={averageRating} hint={pluralize(reviews.length, 'reseña')} />
      </div>

      <section className="card admin-alerts">
        <h2>Requiere atención</h2>
        {alerts.length ? (
          <ul>
            {alerts.map(({ icon: Icon, tone, text, to }) => (
              <li key={to}>
                <Link to={to} className={`admin-alert admin-alert--${tone}`}>
                  <Icon size={18} aria-hidden />
                  <span>{text}</span>
                  <ChevronRight size={16} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="admin-alerts__ok">
            <CircleCheck size={18} aria-hidden />
            Todo en orden. No hay nada pendiente de revisar.
          </p>
        )}
      </section>

      <div className="admin-overview__columns">
        <section>
          <SectionHeader title="Más vendidas" />
          {topExperiences.length ? (
            <ol className="admin-ranking card">
              {topExperiences.map((experience, index) => (
                <li key={experience.id}>
                  <span className="admin-ranking__position">{index + 1}</span>
                  <ImageWithFallback src={experience.images[0]} alt="" className="cell-thumb" />
                  <span className="admin-ranking__text">
                    <Link to={`/experiencias/${experience.id}`}>{experience.title}</Link>
                    <small className="muted">{experience.publisherName}</small>
                  </span>
                  <strong>{formatMoney(experience.sold)}</strong>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">Todavía no hay ventas.</p>
          )}
        </section>

        <section>
          <SectionHeader title="Últimas órdenes">
            <Link to="/admin/ordenes" className="admin-overview__more">
              Ver todas
            </Link>
          </SectionHeader>
          <DataTable
            rows={recentOrders}
            pageSize={0}
            columns={[
              { key: 'id', header: 'Orden', render: (order) => <strong>#{order.id}</strong> },
              { key: 'user', header: 'Cliente', render: (order) => fullName(findById(db.users, order.userId)) },
              { key: 'date', header: 'Fecha', render: (order) => formatFullDate(order.createdAt) },
              {
                key: 'total',
                header: 'Total neto',
                align: 'right',
                render: (order) => formatMoney(order.total - getOrderRefunded(order, db.bookings)),
              },
            ]}
          />
        </section>
      </div>
    </div>
  )
}

export default AdminOverview

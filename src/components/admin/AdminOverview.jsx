import { useEffect, useState } from 'react'
import { CalendarCheck, CalendarX, ChevronRight, CircleCheck, MessageSquareWarning, Receipt, Star, Store, TicketPercent, UserX, Users, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getBookings } from '../../services/bookingsService'
import { getCoupons } from '../../services/couponsService'
import { getAllExperiences } from '../../services/experiencesService'
import { getOrders } from '../../services/ordersService'
import { getReviews } from '../../services/reviewsService'
import { getSessions } from '../../services/sessionsService'
import { getUsers } from '../../services/usersService'
import { getCouponStatus } from '../../utils/coupons'
import { addSessionInfo, byNewest, isSoldOut } from '../../utils/experiences'
import { formatFullDate, formatMoney, isPast, pluralize } from '../../utils/format'
import { getNetSales, getOrderRefunded } from '../../utils/orders'
import DataTable from '../ui/DataTable'
import ImageWithFallback from '../ui/ImageWithFallback'
import SectionHeader from '../ui/SectionHeader'
import StatCard from '../ui/StatCard'
import { COUPON_EXPIRY_WARNING_DAYS, LOW_RATING } from './adminRules'
import './AdminOverview.css'

const RECENT_ORDERS = 5
const TOP_EXPERIENCES = 5
const DAY_MS = 86400000

/** Cosas que conviene revisar, cada una con link a su sección ya filtrada. */
function getAlerts({ experiences, reviews, users, coupons }) {
  const soldOut = experiences.filter(isSoldOut).length
  const withoutDates = experiences.filter((experience) => !experience.upcomingCount).length
  const lowReviews = reviews.filter((review) => review.rating <= LOW_RATING).length
  const inactiveUsers = users.filter((user) => !user.active).length
  const couponsExpiring = coupons.filter(
    (coupon) =>
      getCouponStatus(coupon).label === 'Activo' &&
      new Date(coupon.validUntil).getTime() - Date.now() <= COUPON_EXPIRY_WARNING_DAYS * DAY_MS,
  ).length

  return [
    soldOut && { icon: Store, tone: 'danger', text: pluralize(soldOut, 'experiencia agotada', 'experiencias agotadas'), to: '/admin/experiencias?estado=agotada' },
    withoutDates && { icon: CalendarX, tone: 'warning', text: `${pluralize(withoutDates, 'experiencia', 'experiencias')} sin fechas próximas`, to: '/admin/experiencias?estado=sin-fechas' },
    lowReviews && { icon: MessageSquareWarning, tone: 'danger', text: `${pluralize(lowReviews, 'reseña', 'reseñas')} de ${LOW_RATING}★ o menos para revisar`, to: '/admin/resenas?puntuacion=baja' },
    couponsExpiring && { icon: TicketPercent, tone: 'warning', text: `${pluralize(couponsExpiring, 'cupón', 'cupones')} por vencer`, to: '/admin/cupones?estado=Activo' },
    inactiveUsers && { icon: UserX, tone: 'neutral', text: pluralize(inactiveUsers, 'cuenta desactivada', 'cuentas desactivadas'), to: '/admin/usuarios?estado=inactivo' },
  ].filter(Boolean)
}

function AdminOverview() {
  const [orders, setOrders] = useState([])
  const [bookings, setBookings] = useState([])
  const [users, setUsers] = useState([])
  const [reviews, setReviews] = useState([])
  const [coupons, setCoupons] = useState([])
  const [experiences, setExperiences] = useState([])
  const [sessions, setSessions] = useState([])

  // Al entrar al resumen pedimos todo lo que necesita (cada llamada guarda su resultado en su estado)
  useEffect(() => {
    const showError = (error) => console.error('Error al cargar el resumen:', error)
    getOrders().then((data) => setOrders(data)).catch(showError)
    getBookings().then((data) => setBookings(data)).catch(showError)
    getUsers().then((data) => setUsers(data)).catch(showError)
    getReviews().then((data) => setReviews(data)).catch(showError)
    getCoupons().then((data) => setCoupons(data)).catch(showError)
    getAllExperiences().then((data) => setExperiences(data)).catch(showError)
    getSessions().then((data) => setSessions(data)).catch(showError)
  }, [])

  const catalog = addSessionInfo(experiences, sessions)
  const upcomingBookings = bookings.filter((booking) => !booking.refunded && !isPast(booking.startsAt))
  const recentOrders = [...orders].sort(byNewest).slice(0, RECENT_ORDERS)
  const averageRating = reviews.length ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1) : '—'
  const alerts = getAlerts({ experiences: catalog, reviews, users, coupons })
  const buyerName = (order) => {
    const buyer = users.find((user) => user.id === order.userId)
    return buyer ? `${buyer.firstName} ${buyer.lastName}` : `Usuario #${order.userId}`
  }

  const topExperiences = catalog
    .map((experience) => ({
      ...experience,
      sold: bookings
        .filter((booking) => booking.experienceId === experience.id && !booking.refunded)
        .reduce((sum, booking) => sum + booking.unitPrice * booking.quantity, 0),
    }))
    .filter((experience) => experience.sold > 0)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, TOP_EXPERIENCES)

  return (
    <div className="stack admin-overview">
      <div className="stat-grid">
        <StatCard icon={Wallet} label="Ventas netas" value={formatMoney(getNetSales(orders))} hint="Cobrado menos reembolsos" />
        <StatCard icon={Receipt} label="Órdenes" value={orders.length} />
        <StatCard icon={CalendarCheck} label="Reservas próximas" value={upcomingBookings.length} />
        <StatCard icon={Users} label="Usuarios activos" value={users.filter((user) => user.active).length} />
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
              { key: 'user', header: 'Cliente', render: buyerName },
              { key: 'date', header: 'Fecha', render: (order) => formatFullDate(order.createdAt) },
              { key: 'total', header: 'Total neto', align: 'right', render: (order) => formatMoney(order.total - getOrderRefunded(order)) },
            ]}
          />
        </section>
      </div>
    </div>
  )
}

export default AdminOverview

import { useEffect } from 'react'
import { CalendarCheck, CalendarX, ChevronRight, CircleCheck, HandCoins, MessageSquareWarning, Receipt, Star, Store, TicketPercent, UserX, Users, Wallet } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchBookings } from '../../redux/bookingsSlice'
import { fetchCoupons } from '../../redux/couponsSlice'
import { fetchManagedExperiences, selectManagedExperiences } from '../../redux/experiencesSlice'
import { fetchOrders, fetchOrderStats } from '../../redux/ordersSlice'
import { fetchAllReviews } from '../../redux/reviewsSlice'
import { fetchManagedSessions } from '../../redux/sessionsSlice'
import { fetchUsers } from '../../redux/usersSlice'
import { getCouponStatus } from '../../utils/coupons'
import { byNewest, isSoldOut } from '../../utils/experiences'
import { formatFullDate, formatMoney, isPast, pluralize } from '../../utils/format'
import DataTable from '../ui/DataTable'
import ErrorState from '../ui/ErrorState'
import ImageWithFallback from '../ui/ImageWithFallback'
import Loading from '../ui/Loading'
import SectionHeader from '../ui/SectionHeader'
import StatCard from '../ui/StatCard'
import { COUPON_EXPIRY_WARNING_DAYS, LOW_RATING } from './adminRules'
import './AdminOverview.css'

const RECENT_ORDERS = 5
// Todo lo que muestra el resumen. Cada GET se hace una sola vez: lo que ya se cargó en otra sección del panel se reutiliza
const LOADERS = [fetchOrders, fetchOrderStats, fetchBookings, fetchUsers, fetchAllReviews, fetchCoupons, fetchManagedExperiences, fetchManagedSessions]
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
  const dispatch = useDispatch()
  // Cada parte del estado global que usa el resumen ({ items, loading, loaded, error })
  const orders = useSelector((state) => state.orders)
  const stats = useSelector((state) => state.orders.stats) // ventas y comisión calculadas por el back
  const bookings = useSelector((state) => state.bookings)
  const users = useSelector((state) => state.users)
  const coupons = useSelector((state) => state.coupons)
  const experiences = useSelector((state) => state.experiences.managed)
  const sessions = useSelector((state) => state.sessions.managed)
  const reviews = useSelector((state) => state.reviews)
  const catalog = useSelector(selectManagedExperiences) // todas las experiencias con la info de sus fechas

  // Al entrar: despachamos todos los GET (los que ya se hicieron en otra sección no se repiten)
  useEffect(() => {
    LOADERS.forEach((load) => dispatch(load()))
  }, [dispatch])

  const lists = [orders, stats, bookings, users, coupons, experiences, sessions]
  // Si algo falla se muestra el error (y no un "0 ventas" engañoso)
  const error = lists.find((list) => list.error)?.error ?? reviews.error
  const loading = lists.some((list) => !list.loaded) || !reviews.requested.includes('all') || reviews.loading

  if (error) {
    return <ErrorState title="No pudimos cargar el resumen" message={error} onRetry={() => LOADERS.forEach((load) => dispatch(load()))} />
  }
  if (loading) return <Loading />

  return (
    <OverviewContent
      catalog={catalog}
      stats={stats.data}
      orders={orders.items}
      bookings={bookings.items}
      users={users.items}
      reviews={reviews.items}
      coupons={coupons.items}
    />
  )
}

/** El resumen ya con todos los datos. */
function OverviewContent({ catalog, stats, orders, bookings, users, reviews, coupons }) {
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
        <StatCard icon={Wallet} label="Ventas netas" value={formatMoney(stats.netSales)} hint="Cobrado menos reembolsos" />
        <StatCard
          icon={HandCoins}
          label={`Comisión PLAN (${stats.commissionRate}%)`}
          value={formatMoney(stats.commission)}
          hint="Lo que gana PLAN sobre las ventas netas"
        />
        <StatCard icon={Receipt} label="Órdenes" value={stats.orderCount} />
        <StatCard icon={CalendarCheck} label="Reservas próximas" value={upcomingBookings.length} />
        <StatCard icon={Users} label="Usuarios activos" value={users.filter((user) => user.active).length} />
        <StatCard icon={Store} label="Experiencias" value={catalog.length} />
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
              { key: 'total', header: 'Total neto', align: 'right', render: (order) => formatMoney(order.total - order.refunded) },
              { key: 'commission', header: 'Comisión', align: 'right', render: (order) => formatMoney(order.commission) },
            ]}
          />
        </section>
      </div>
    </div>
  )
}

export default AdminOverview

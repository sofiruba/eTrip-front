import { useEffect, useState } from 'react'
import { Printer, Star, Undo2 } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import BookingInfoCard from '../components/booking/BookingInfoCard'
import CancellationPolicy from '../components/booking/CancellationPolicy'
import OrderSummary from '../components/booking/OrderSummary'
import RefundModal from '../components/booking/RefundModal'
import ReviewFormModal from '../components/booking/ReviewFormModal'
import VoucherCard from '../components/booking/VoucherCard'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import ErrorState from '../components/ui/ErrorState'
import Loading from '../components/ui/Loading'
import PageHeader from '../components/ui/PageHeader'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { selectUser } from '../redux/authSlice'
import { fetchBookingById, selectBookingById } from '../redux/bookingsSlice'
import { fetchExperienceById } from '../redux/experiencesSlice'
import { fetchOrderById, selectOrderById } from '../redux/ordersSlice'
import { fetchMyReviews } from '../redux/reviewsSlice'
import { getBookingStatus } from '../utils/bookings'
import { getCancellationPolicy } from '../utils/cancellation'
import { formatFullDate, isPast } from '../utils/format'
import { toSummaryItems } from '../utils/orders'
import NotFoundPage from './NotFoundPage'
import './BookingDetailPage.css'

function BookingDetailPage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const user = useSelector(selectUser)
  useDocumentTitle(`Reserva #${id}`)
  const [modal, setModal] = useState(null) // 'refund' | 'review' | null

  // La reserva: de "Mis reservas" si ya estaba en el store, o pedida aparte (si se entró por link)
  const booking = useSelector((state) => selectBookingById(state, id))
  const bookingDetail = useSelector((state) => state.bookings.details[id])
  const orderId = booking?.orderId
  const order = useSelector((state) => (orderId ? selectOrderById(state, orderId) : null))
  const orderDetail = useSelector((state) => state.orders.details[orderId])
  // La experiencia (foto y lugar): del catálogo, o pedida aparte si ya no está publicada
  const experienceId = booking?.experienceId
  const fromCatalog = useSelector((state) => state.experiences.items.find((entry) => entry.id === experienceId))
  const fromDetail = useSelector((state) => state.experiences.details[experienceId]?.item)
  const catalogLoaded = useSelector((state) => state.experiences.loaded)
  const experience = fromCatalog ?? fromDetail ?? null
  const myReview = useSelector((state) =>
    state.reviews.items.find((review) => review.experienceId === experienceId && review.userId === user.id),
  )

  // 1) La reserva y mis reseñas (cada thunk se saltea el GET si ya está en el store)
  useEffect(() => {
    dispatch(fetchBookingById(id))
    dispatch(fetchMyReviews())
  }, [id, dispatch])

  // 2) Cuando ya tenemos la reserva: su orden (para el resumen)
  useEffect(() => {
    if (orderId) dispatch(fetchOrderById(orderId))
  }, [orderId, dispatch])

  // 3) Si la experiencia no está en el catálogo (el anfitrión la pausó), la pedimos por id
  const inCatalog = Boolean(fromCatalog)
  useEffect(() => {
    if (experienceId && catalogLoaded && !inCatalog) dispatch(fetchExperienceById(experienceId))
  }, [experienceId, catalogLoaded, inCatalog, dispatch])

  // 404/403 = no existe o no es tuya; otro error = el back falló
  if (bookingDetail?.notFound) return <NotFoundPage title="No encontramos esta reserva" />
  const error = bookingDetail?.error || orderDetail?.error
  if (error) {
    const retry = () => {
      dispatch(fetchBookingById(id))
      if (orderId) dispatch(fetchOrderById(orderId))
    }
    return (
      <div className="container page page--narrow">
        <ErrorState title="No pudimos cargar tu reserva" message={error} onRetry={retry} />
      </div>
    )
  }
  if (!booking || !order) return <Loading />

  const past = isPast(booking.startsAt)
  const status = getBookingStatus({ ...booking, isPast: past })
  // Misma regla que se muestra en el checkout: reembolso solo hasta 48 h antes
  const policy = getCancellationPolicy(booking.startsAt)
  const showPolicy = !past && !booking.refunded
  const canRefund = showPolicy && policy.refundable
  // El back no permite editar reseñas: solo se escribe una vez, cuando la experiencia terminó
  const canReview = isPast(booking.endsAt) && !booking.refunded && !myReview

  return (
    <div className="container page">
      <PageHeader back={{ to: '/mis-reservas', label: 'Mis reservas' }} eyebrow={`Reserva #${booking.id}`} title={booking.experienceTitle} />

      <div className="split">
        <div className="stack">
          <BookingInfoCard booking={booking} experience={experience} status={status} />
          {showPolicy && <CancellationPolicy policy={policy} />}

          <VoucherCard booking={booking} />

          <div className="row">
            {experience && (
              <Button variant="secondary" to={`/experiencias/${experience.id}`}>
                Ver experiencia
              </Button>
            )}
            {canReview && (
              <Button icon={Star} onClick={() => setModal('review')}>
                Escribir reseña
              </Button>
            )}
            {myReview && <Badge tone="success">Ya dejaste tu reseña</Badge>}
            {canRefund && (
              <Button variant="danger" icon={Undo2} onClick={() => setModal('refund')}>
                Pedir reembolso
              </Button>
            )}
          </div>
        </div>

        <OrderSummary
          title={`Orden #${order.id}`}
          items={toSummaryItems(order.bookings)}
          discount={order.discountAmount}
          couponCode={order.couponCode}
          totalLabel="Total pagado"
          refunded={Number(order.refunded ?? 0)}
        >
          <p className="muted small">Comprada el {formatFullDate(order.createdAt)}</p>
          <Button variant="ghost" icon={Printer} full onClick={() => window.print()}>
            Descargar comprobante
          </Button>
        </OrderSummary>
      </div>

      {/* Después del reembolso o de la reseña, los reducers actualizan la reserva, la orden, los lugares y la reseña:
          esta página está suscripta a esos datos y se vuelve a dibujar sola */}
      {modal === 'refund' && <RefundModal booking={booking} order={order} onClose={() => setModal(null)} />}
      {modal === 'review' && (
        <ReviewFormModal experienceId={booking.experienceId} experienceTitle={booking.experienceTitle} onClose={() => setModal(null)} />
      )}
    </div>
  )
}

export default BookingDetailPage

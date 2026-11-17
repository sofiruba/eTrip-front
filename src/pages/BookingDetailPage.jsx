import { useEffect, useState } from 'react'
import { Gift, Printer, Star, Undo2 } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import BookingExtras from '../components/booking/BookingExtras'
import BookingInfoCard from '../components/booking/BookingInfoCard'
import CancellationPolicy from '../components/booking/CancellationPolicy'
import OrderSummary from '../components/booking/OrderSummary'
import PendingGiftCard from '../components/booking/PendingGiftCard'
import RefundModal from '../components/booking/RefundModal'
import ReviewFormModal from '../components/booking/ReviewFormModal'
import VoucherCard from '../components/booking/VoucherCard'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import ErrorState from '../components/ui/ErrorState'
import Loading from '../components/ui/Loading'
import PageHeader from '../components/ui/PageHeader'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { fetchBookingById } from '../redux/bookingsSlice'
import { fetchExperienceById } from '../redux/experiencesSlice'
import { fetchOrderById } from '../redux/ordersSlice'
import { fetchMyReviews } from '../redux/reviewsSlice'
import { getBookingStatus } from '../utils/bookings'
import { describeCancellation } from '../utils/cancellation'
import { formatFullDate, isPast } from '../utils/format'
import { toSummaryItems } from '../utils/orders'
import NotFoundPage from './NotFoundPage'
import './BookingDetailPage.css'

function BookingDetailPage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  useDocumentTitle(`Reserva #${id}`)
  const [modal, setModal] = useState(null) // 'refund' | 'review' | null

  // La reserva: de "Mis reservas" si ya estaba en el store, o pedida aparte (si se entró por link)
  const booking = useSelector((state) => state.bookings.items.find((entry) => entry.id === Number(id)) ?? state.bookings.details[id]?.item)
  const bookingDetail = useSelector((state) => state.bookings.details[id])
  // Un regalo que recibí: la orden (el comprobante) es de quien lo compró, no mía. No se pide ni se muestra
  const isGiftReceived = Boolean(booking) && booking.recipientId === user.id && booking.buyerId !== user.id
  const orderId = isGiftReceived ? null : booking?.orderId
  const order = useSelector((state) => state.orders.items.find((entry) => entry.id === orderId) ?? state.orders.details[orderId]?.item)
  const orderDetail = useSelector((state) => state.orders.details[orderId])
  // La experiencia (foto y lugar): del catálogo, o pedida aparte si ya no está publicada
  const experienceId = booking?.experienceId
  const fromCatalog = useSelector((state) => state.experiences.items.find((entry) => entry.id === experienceId))
  const experienceDetail = useSelector((state) => state.experiences.details[experienceId])
  const fromDetail = experienceDetail?.item
  const catalogLoaded = useSelector((state) => state.experiences.loaded)
  const experience = fromCatalog ?? fromDetail ?? null
  const myReview = useSelector((state) =>
    state.reviews.items.find((review) => review.experienceId === experienceId && review.userId === user.id),
  )
  const myReviewsRequested = useSelector((state) => state.reviews.requested.includes('mine'))

  // 1) La reserva, si no estaba en "Mis reservas", y mis reseñas, si todavía no se pidieron
  useEffect(() => {
    if (!booking && !bookingDetail) dispatch(fetchBookingById(id))
  }, [booking, bookingDetail, id, dispatch])
  useEffect(() => {
    if (!myReviewsRequested) dispatch(fetchMyReviews())
  }, [myReviewsRequested, dispatch])

  // 2) Cuando ya tenemos la reserva: su orden (para el resumen), si no está en el store
  useEffect(() => {
    if (orderId && !order && !orderDetail) dispatch(fetchOrderById(orderId))
  }, [orderId, order, orderDetail, dispatch])

  // 3) Si la experiencia no está en el catálogo (el anfitrión la pausó), la pedimos por id
  const inCatalog = Boolean(fromCatalog)
  useEffect(() => {
    if (experienceId && catalogLoaded && !inCatalog && !experienceDetail) dispatch(fetchExperienceById(experienceId))
  }, [experienceId, catalogLoaded, inCatalog, experienceDetail, dispatch])

  // 404/403 = no existe o no es tuya; otro error = el back falló
  if (bookingDetail?.notFound) return <NotFoundPage title="No encontramos esta reserva" />
  const error = bookingDetail?.error || orderDetail?.error
  if (error) {
    const retry = () => {
      if (bookingDetail?.error) dispatch(fetchBookingById(id))
      if (orderDetail?.error) dispatch(fetchOrderById(orderId))
    }
    return (
      <div className="container page page--narrow">
        <ErrorState title="No pudimos cargar tu reserva" message={error} onRetry={retry} />
      </div>
    )
  }
  if (!booking || (orderId && !order)) return <Loading />

  const past = isPast(booking.startsAt)
  const status = getBookingStatus(booking)
  // Si se puede cancelar (y hasta cuándo) y si se puede reseñar lo decide el back según quién mira la reserva
  const showPolicy = !past && !booking.refunded && Boolean(booking.refundableUntil)
  const policy = describeCancellation(booking.refundableUntil, booking.refundable)
  const canReview = booking.reviewable && !myReview

  return (
    <div className="container page">
      <PageHeader back={{ to: '/mis-reservas', label: 'Mis reservas' }} eyebrow={`Reserva #${booking.id}`} title={booking.experienceTitle} />

      <div className="split">
        <div className="stack">
          <BookingInfoCard booking={booking} experience={experience} status={status} />
          {showPolicy && <CancellationPolicy policy={policy} />}

          <VoucherCard booking={booking} />
          {/* Regalo que todavía no es de quien lo recibe (el estado lo calcula el back) */}
          {!isGiftReceived && order?.giftStatus === 'PENDING' && <PendingGiftCard order={order} />}
          {!past && <BookingExtras booking={booking} experience={experience} />}

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
            {booking.refundable && (
              <Button variant="danger" icon={Undo2} onClick={() => setModal('refund')}>
                Pedir reembolso
              </Button>
            )}
          </div>
        </div>

        {isGiftReceived ? (
          <aside className="card stack">
            <span className="eyebrow">Regalo</span>
            <p>
              <Gift size={18} aria-hidden /> Este plan te lo regaló <strong>{booking.giftFromName}</strong>. El comprobante de pago lo tiene esa persona.
            </p>
            {showPolicy && (
              <p className="muted small">
                Si no podés ir, cancelalo desde acá: la plata vuelve a {booking.giftFromName}.
              </p>
            )}
          </aside>
        ) : (
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
        )}
      </div>

      {/* Después del reembolso o de la reseña, los reducers actualizan la reserva, la orden, los lugares y la reseña:
          esta página está suscripta a esos datos y se vuelve a dibujar sola */}
      {modal === 'refund' && <RefundModal booking={booking} onClose={() => setModal(null)} />}
      {modal === 'review' && (
        <ReviewFormModal experienceId={booking.experienceId} experienceTitle={booking.experienceTitle} onClose={() => setModal(null)} />
      )}
    </div>
  )
}

export default BookingDetailPage

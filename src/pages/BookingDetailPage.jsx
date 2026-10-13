import { useEffect, useState } from 'react'
import { Printer, Star, Undo2 } from 'lucide-react'
import { useParams } from 'react-router-dom'
import BookingInfoCard from '../components/booking/BookingInfoCard'
import CancellationPolicy from '../components/booking/CancellationPolicy'
import OrderSummary from '../components/booking/OrderSummary'
import RefundModal from '../components/booking/RefundModal'
import ReviewFormModal from '../components/booking/ReviewFormModal'
import VoucherCard from '../components/booking/VoucherCard'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Loading from '../components/ui/Loading'
import PageHeader from '../components/ui/PageHeader'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { getBooking } from '../services/bookingsService'
import { getExperience } from '../services/experiencesService'
import { getOrder } from '../services/ordersService'
import { getMyReviews } from '../services/reviewsService'
import { getBookingStatus } from '../utils/bookings'
import { getCancellationPolicy } from '../utils/cancellation'
import { formatFullDate, isPast } from '../utils/format'
import { getOrderRefunded, toSummaryItems } from '../utils/orders'
import NotFoundPage from './NotFoundPage'
import './BookingDetailPage.css'

function BookingDetailPage() {
  const { id } = useParams()
  useDocumentTitle(`Reserva #${id}`)
  const [booking, setBooking] = useState(null)
  const [order, setOrder] = useState(null)
  const [experience, setExperience] = useState(null)
  const [myReview, setMyReview] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [modal, setModal] = useState(null) // 'refund' | 'review' | null

  // 1) La reserva, apenas entramos (o si cambia el id)
  useEffect(() => {
    getBooking(id)
      .then((data) => setBooking(data))
      .catch(() => setNotFound(true))
  }, [id])

  // 2) Cuando ya tenemos la reserva: su orden, su experiencia y si ya la reseñé
  const orderId = booking?.orderId
  const experienceId = booking?.experienceId
  useEffect(() => {
    if (!orderId) return
    getOrder(orderId)
      .then((data) => setOrder(data))
      .catch((error) => console.error('Error al traer la orden:', error))

    getExperience(experienceId)
      .then((data) => setExperience(data))
      .catch((error) => console.error('Error al traer la experiencia:', error))

    getMyReviews()
      .then((reviews) => setMyReview(reviews.find((review) => review.experienceId === experienceId) ?? null))
      .catch((error) => console.error('Error al traer tus reseñas:', error))
  }, [orderId, experienceId])

  if (notFound) return <NotFoundPage title="No encontramos esta reserva" />
  if (!booking || !order) return <Loading />

  const past = isPast(booking.startsAt)
  const status = getBookingStatus({ ...booking, isPast: past })
  // Misma regla que se muestra en el checkout: reembolso solo hasta 48 h antes
  const policy = getCancellationPolicy(booking.startsAt)
  const showPolicy = !past && !booking.refunded
  const canRefund = showPolicy && policy.refundable
  // El back no permite editar reseñas: solo se escribe una vez, cuando la experiencia terminó
  const canReview = isPast(booking.endsAt) && !booking.refunded && !myReview

  // Después del reembolso el back devuelve la reserva actualizada: la guardamos en el estado
  const handleRefunded = (updated) => {
    setBooking(updated)
    setOrder({ ...order, bookings: order.bookings.map((entry) => (entry.id === updated.id ? updated : entry)) })
  }

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
          refunded={getOrderRefunded(order)}
        >
          <p className="muted small">Comprada el {formatFullDate(order.createdAt)}</p>
          <Button variant="ghost" icon={Printer} full onClick={() => window.print()}>
            Descargar comprobante
          </Button>
        </OrderSummary>
      </div>

      {modal === 'refund' && (
        <RefundModal booking={booking} order={order} onRefunded={handleRefunded} onClose={() => setModal(null)} />
      )}
      {modal === 'review' && (
        <ReviewFormModal
          experienceId={booking.experienceId}
          experienceTitle={booking.experienceTitle}
          onCreated={(review) => setMyReview(review)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

export default BookingDetailPage

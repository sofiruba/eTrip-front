import { useState } from 'react'
import { CalendarDays, Clock, MapPin, Printer, Star, Undo2, Users } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { getBookingStatus } from '../components/booking/bookingStatus'
import OrderSummary from '../components/booking/OrderSummary'
import RefundModal from '../components/booking/RefundModal'
import ReviewFormModal from '../components/booking/ReviewFormModal'
import { toSummaryItems } from '../components/booking/toSummaryItems'
import VoucherCard from '../components/booking/VoucherCard'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import ImageWithFallback from '../components/ui/ImageWithFallback'
import PageHeader from '../components/ui/PageHeader'
import { findById, toBookingView } from '../data/selectors'
import { useAuth } from '../hooks/useAuth'
import { useStore } from '../hooks/useStore'
import { formatFullDate, formatLongDate, formatTime, pluralize } from '../utils/format'
import NotFoundPage from './NotFoundPage'
import './BookingDetailPage.css'

function BookingDetailPage() {
  const { id } = useParams()
  const { db } = useStore()
  const { user } = useAuth()
  const [modal, setModal] = useState(null) // 'refund' | 'review' | null

  const raw = findById(db.bookings, id)
  if (!raw || raw.buyerId !== user.id) return <NotFoundPage title="No encontramos esta reserva" />

  const booking = toBookingView(db, raw)
  const { experience } = booking
  const status = getBookingStatus(booking)
  const order = findById(db.orders, booking.orderId)
  const orderBookings = db.bookings.filter((entry) => entry.orderId === order.id)
  const myReview = db.reviews.find((review) => review.userId === user.id && review.experienceId === booking.experienceId)
  const canRefund = !booking.isPast && !booking.refunded
  const canReview = booking.isPast && !booking.refunded && experience

  return (
    <div className="container page">
      <PageHeader back={{ to: '/mis-reservas', label: 'Mis reservas' }} eyebrow={`Reserva #${booking.id}`} title={booking.experienceTitle} />

      <div className="split">
        <div className="stack">
          <section className="card booking-detail">
            <ImageWithFallback src={experience?.images[0]} alt="" className="booking-detail__image" />
            <div className="booking-detail__info">
              <Badge tone={status.tone}>{status.label}</Badge>
              <ul>
                <li>
                  <CalendarDays size={18} aria-hidden />
                  {formatLongDate(booking.startsAt)}
                </li>
                <li>
                  <Clock size={18} aria-hidden />
                  {formatTime(booking.startsAt)} a {formatTime(booking.endsAt)}
                </li>
                {experience && (
                  <li>
                    <MapPin size={18} aria-hidden />
                    {experience.location}
                  </li>
                )}
                <li>
                  <Users size={18} aria-hidden />
                  {pluralize(booking.quantity, 'persona')}
                </li>
              </ul>
            </div>
          </section>

          <VoucherCard booking={booking} />

          <div className="row">
            {experience && (
              <Button variant="secondary" to={`/experiencias/${experience.id}`}>
                Ver experiencia
              </Button>
            )}
            {canReview && (
              <Button icon={Star} onClick={() => setModal('review')}>
                {myReview ? 'Editar mi reseña' : 'Escribir reseña'}
              </Button>
            )}
            {canRefund && (
              <Button variant="danger" icon={Undo2} onClick={() => setModal('refund')}>
                Pedir reembolso
              </Button>
            )}
          </div>
        </div>

        <OrderSummary
          title={`Orden #${order.id}`}
          items={toSummaryItems(orderBookings)}
          discount={order.discountAmount}
          couponCode={order.couponCode}
          totalLabel="Total pagado"
        >
          <p className="muted small">Comprada el {formatFullDate(order.createdAt)}</p>
          <Button variant="ghost" icon={Printer} full onClick={() => window.print()}>
            Descargar comprobante
          </Button>
        </OrderSummary>
      </div>

      {modal === 'refund' && <RefundModal booking={booking} onClose={() => setModal(null)} />}
      {modal === 'review' && (
        <ReviewFormModal
          experienceId={booking.experienceId}
          experienceTitle={booking.experienceTitle}
          review={myReview}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

export default BookingDetailPage

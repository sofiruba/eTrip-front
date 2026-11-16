import { CalendarDays, ChevronRight, Gift, MapPin, Users } from 'lucide-react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { formatSessionDate, pluralize } from '../../utils/format'
import Badge from '../ui/Badge'
import ImageWithFallback from '../ui/ImageWithFallback'
import { getBookingStatus } from '../../utils/bookings'
import './BookingCard.css'

/** Tarjeta de una reserva (link al detalle). `action` (opcional) es un botón que va debajo, fuera del link. */
function BookingCard({ booking, action }) {
  const status = getBookingStatus(booking)
  const userId = useSelector((state) => state.auth.user?.id)
  // El regalo lo hice yo (lo veo como "para X") o me lo hicieron ("de X")
  const giftedByMe = booking.buyerId === userId
  const { experience } = booking

  const card = (
    <Link to={`/mis-reservas/${booking.id}`} className="booking-card">
      <ImageWithFallback src={experience?.images[0]} alt="" className="booking-card__image" />
      <div className="booking-card__body">
        <div className="row">
          <Badge tone={status.tone}>{status.label}</Badge>
          {booking.giftRecipientName && (
            <Badge tone={giftedByMe && booking.giftStatus === 'PENDING' ? 'warning' : 'brand'}>
              <Gift size={12} aria-hidden />
              {giftedByMe ? `Regalo para ${booking.giftRecipientName}` : `Regalo de ${booking.giftFromName}`}
              {giftedByMe && booking.giftStatus === 'PENDING' && ' · pendiente'}
            </Badge>
          )}
        </div>
        <h3>{booking.experienceTitle}</h3>
        <div className="booking-card__meta">
          <span className="meta">
            <CalendarDays size={15} aria-hidden />
            {formatSessionDate(booking.startsAt)}
          </span>
          {experience && (
            <span className="meta">
              <MapPin size={15} aria-hidden />
              {experience.location}
            </span>
          )}
          <span className="meta">
            <Users size={15} aria-hidden />
            {pluralize(booking.quantity, 'persona')}
          </span>
        </div>
      </div>
      <div className="booking-card__code">
        <small className="muted">Voucher</small>
        <strong>{booking.voucherCode}</strong>
      </div>
      <ChevronRight size={20} className="booking-card__arrow" aria-hidden />
    </Link>
  )

  // Un link no puede tener otro link adentro: la acción va debajo de la tarjeta, no dentro
  if (!action) return card
  return (
    <div className="booking-card-wrap">
      {card}
      <div className="booking-card-wrap__action">{action}</div>
    </div>
  )
}

export default BookingCard

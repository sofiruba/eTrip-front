import { CalendarDays, ChevronRight, MapPin, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatSessionDate, pluralize } from '../../utils/format'
import Badge from '../ui/Badge'
import ImageWithFallback from '../ui/ImageWithFallback'
import { getBookingStatus } from './bookingStatus'
import './BookingCard.css'

function BookingCard({ booking }) {
  const status = getBookingStatus(booking)
  const { experience } = booking

  return (
    <Link to={`/mis-reservas/${booking.id}`} className="booking-card">
      <ImageWithFallback src={experience?.images[0]} alt="" className="booking-card__image" />
      <div className="booking-card__body">
        <Badge tone={status.tone}>{status.label}</Badge>
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
}

export default BookingCard

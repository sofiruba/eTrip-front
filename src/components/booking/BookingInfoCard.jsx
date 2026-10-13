import { CalendarDays, Clock, MapPin, Users } from 'lucide-react'
import { formatLongDate, formatTime, pluralize } from '../../utils/format'
import Badge from '../ui/Badge'
import ImageWithFallback from '../ui/ImageWithFallback'
import './BookingInfoCard.css'

/** Foto, estado y datos de una reserva (fecha, horario, lugar y personas). */
function BookingInfoCard({ booking, experience, status }) {
  return (
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
  )
}

export default BookingInfoCard

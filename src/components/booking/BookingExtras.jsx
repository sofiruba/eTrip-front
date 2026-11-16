import { CalendarPlus, MessageCircle } from 'lucide-react'
import { downloadIcs, googleCalendarUrl, whatsappUrl } from '../../utils/calendar'
import { formatSessionDate } from '../../utils/format'
import Button from '../ui/Button'

/**
 * "Agregar a mi calendario" y "Compartir por WhatsApp" de una reserva confirmada.
 * Todo se arma en el front con los datos de la reserva: no se le pide nada al back.
 */
function BookingExtras({ booking, experience }) {
  if (booking.refunded) return null

  const url = `${window.location.origin}/experiencias/${booking.experienceId}`
  const event = {
    uid: `reserva-${booking.id}`,
    title: `${booking.experienceTitle} (PLAN)`,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    location: experience?.location ?? '',
    description: `Voucher ${booking.voucherCode} · ${booking.quantity} ${booking.quantity === 1 ? 'persona' : 'personas'}. ${url}`,
    url,
  }
  const message = `¡Tengo plan! ${booking.experienceTitle}, ${formatSessionDate(booking.startsAt)}. ¿Te sumás? ${url}`

  return (
    <div className="row">
      <Button variant="secondary" size="sm" icon={CalendarPlus} onClick={() => downloadIcs(event, `plan-${booking.id}.ics`)}>
        Agregar a mi calendario
      </Button>
      <a className="btn btn--ghost btn--sm" href={googleCalendarUrl(event)} target="_blank" rel="noreferrer">
        Google Calendar
      </a>
      <a className="btn btn--ghost btn--sm" href={whatsappUrl(message)} target="_blank" rel="noreferrer">
        <MessageCircle size={16} aria-hidden />
        Compartir por WhatsApp
      </a>
    </div>
  )
}

export default BookingExtras

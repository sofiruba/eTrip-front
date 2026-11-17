import { useState } from 'react'
import { CalendarPlus, Share2 } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { shareVoucher } from '../../redux/bookingsSlice'
import { showToast } from '../../redux/toastsSlice'
import { downloadIcs, googleCalendarUrl } from '../../utils/calendar'
import Button from '../ui/Button'

/**
 * "Compartir voucher" y "Agregar a mi calendario" de una reserva confirmada.
 * El voucher es un archivo (imagen) que arma el back y solo le da a quien lo tiene: se comparte el archivo,
 * no un link, porque la reserva de otra cuenta no se puede ver. El calendario se arma en el front.
 */
function BookingExtras({ booking, experience }) {
  const dispatch = useDispatch()
  const [sharing, setSharing] = useState(false)
  if (booking.refunded) return null

  const event = {
    uid: `reserva-${booking.id}`,
    title: `${booking.experienceTitle} (PLAN)`,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    location: experience?.location ?? '',
    description: `${booking.quantity} ${booking.quantity === 1 ? 'persona' : 'personas'}. El voucher está en Mis reservas de PLAN.`,
  }

  const share = () => {
    setSharing(true)
    dispatch(shareVoucher(booking)).then((action) => {
      setSharing(false)
      if (action.error) return dispatch(showToast({ message: action.error.message, tone: 'error' }))
      if (action.payload === 'downloaded') return dispatch(showToast({ message: 'Descargamos el voucher: ya lo podés mandar' }))
      return null
    })
  }

  return (
    <div className="row">
      {/* Un regalo que ya entregaste: el voucher es de quien lo recibió (el back no te manda el código) */}
      {booking.voucherCode && (
        <Button variant="secondary" size="sm" icon={Share2} onClick={share} disabled={sharing}>
          {sharing ? 'Preparando…' : 'Compartir voucher'}
        </Button>
      )}
      <Button variant="ghost" size="sm" icon={CalendarPlus} onClick={() => downloadIcs(event, `plan-${booking.id}.ics`)}>
        Agregar a mi calendario
      </Button>
      <a className="btn btn--ghost btn--sm" href={googleCalendarUrl(event)} target="_blank" rel="noreferrer">
        Google Calendar
      </a>
    </div>
  )
}

export default BookingExtras

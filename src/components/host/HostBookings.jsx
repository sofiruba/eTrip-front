import { useState } from 'react'
import { Undo2, Users } from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import { refundBooking } from '../../services/bookingsService'
import { formatLongDate, formatTime, pluralize } from '../../utils/format'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import EmptyState from '../ui/EmptyState'
import CapacityBar from './CapacityBar'
import './HostBookings.css'

/**
 * Huéspedes agrupados por sesión (solo próximas y no reembolsadas).
 * `setBookings` actualiza la lista del padre después de un reembolso.
 */
function HostBookings({ bookings, sessions, setBookings }) {
  const notify = useToast()
  const [refunding, setRefunding] = useState(null)
  const active = bookings.filter((booking) => !booking.isPast && !booking.refunded)

  const groups = Object.values(
    active.reduce((acc, booking) => {
      const key = booking.experienceSessionId
      acc[key] ??= { session: sessions.find((session) => session.id === key), title: booking.experienceTitle, bookings: [] }
      acc[key].bookings.push(booking)
      return acc
    }, {}),
  ).filter((group) => group.session)

  if (!groups.length) {
    return <EmptyState icon={Users} title="Todavía no hay reservas próximas" text="Cuando alguien reserve una de tus fechas la vas a ver acá." />
  }

  return (
    <div className="stack">
      {groups.map(({ session, title, bookings: guests }) => (
        <section key={session.id} className="card guest-group">
          <header className="guest-group__header">
            <div>
              <span className="eyebrow">{title}</span>
              <h3>
                {formatLongDate(session.startsAt)} · {formatTime(session.startsAt)}
              </h3>
            </div>
            <CapacityBar session={session} />
          </header>
          <ul className="guest-list">
            {guests.map((booking) => (
              <li key={booking.id}>
                <Avatar name={booking.buyerName} size="sm" />
                <span className="guest-list__name">
                  <strong>{booking.buyerName}</strong>
                  <small className="muted">
                    {pluralize(booking.quantity, 'persona')} · {booking.voucherCode}
                  </small>
                </span>
                <Button size="sm" variant="danger" icon={Undo2} onClick={() => setRefunding(booking)}>
                  Reembolsar
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {refunding && (
        <ConfirmDialog
          title="¿Cancelar y reembolsar reserva?"
          message={`Se anula el voucher ${refunding.voucherCode} y se le devuelve el dinero a ${refunding.buyerName}.`}
          confirmLabel="Reembolsar"
          onConfirm={() =>
            refundBooking(refunding.id)
              .then((updated) => {
                setBookings((current) => current.map((item) => (item.id === updated.id ? updated : item)))
                notify('Reserva reembolsada')
              })
              .catch((error) => notify(error.message, 'error'))
          }
          onClose={() => setRefunding(null)}
        />
      )}
    </div>
  )
}

export default HostBookings

import { Mail, Users } from 'lucide-react'
import { findById } from '../../data/selectors'
import { useStore } from '../../hooks/useStore'
import { formatLongDate, formatTime, fullName, pluralize } from '../../utils/format'
import Avatar from '../ui/Avatar'
import EmptyState from '../ui/EmptyState'
import CapacityBar from './CapacityBar'
import './HostBookings.css'

/** Huéspedes agrupados por sesión (solo próximas y no reembolsadas). */
function HostBookings({ bookings }) {
  const { db } = useStore()
  const active = bookings.filter((booking) => !booking.isPast && !booking.refunded)

  const groups = Object.values(
    active.reduce((acc, booking) => {
      const key = booking.experienceSessionId
      acc[key] ??= { session: findById(db.sessions, key), title: booking.experienceTitle, bookings: [] }
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
            {guests.map((booking) => {
              const guest = findById(db.users, booking.buyerId)
              return (
                <li key={booking.id}>
                  <Avatar name={booking.buyerName} size="sm" />
                  <span className="guest-list__name">
                    <strong>{booking.buyerName}</strong>
                    <small className="muted">
                      {pluralize(booking.quantity, 'persona')} · {booking.voucherCode}
                    </small>
                  </span>
                  {guest && (
                    <a className="btn btn--ghost btn--sm" href={`mailto:${guest.email}`} aria-label={`Escribirle a ${fullName(guest)}`}>
                      <Mail size={16} aria-hidden />
                      Escribir
                    </a>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

export default HostBookings

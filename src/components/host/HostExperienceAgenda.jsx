import { useState } from 'react'
import { ArrowLeft, BellRing, CalendarPlus, CalendarX, ChevronDown, Eye, Gift, Pencil, Trash2, Undo2, Users } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { refundBooking } from '../../redux/bookingsSlice'
import { cancelSession, removeSession } from '../../redux/sessionsSlice'
import { showToast } from '../../redux/toastsSlice'
import { formatMoney, formatTimeRange, formatWeekdayDate, pluralize } from '../../utils/format'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import EmptyState from '../ui/EmptyState'
import IconButton from '../ui/IconButton'
import CapacityBar from './CapacityBar'
import SessionFormModal from './SessionFormModal'
import './HostAgenda.css'

// El estado de cada fecha lo calcula el back: acá solo se elige el texto, el color y en qué pestaña va
const SESSION_STATUS = {
  PUBLISHED: { label: 'Publicada', tone: 'success', view: 'proximas' },
  SOLD_OUT: { label: 'Agotada', tone: 'brand', view: 'proximas' },
  FINISHED: { label: 'Finalizada', tone: 'neutral', view: 'pasadas' },
  CANCELLED: { label: 'Cancelada', tone: 'danger', view: 'canceladas' },
}
const statusOf = (session) => SESSION_STATUS[session.status] ?? SESSION_STATUS.PUBLISHED

// Las cantidades de cada pestaña vienen del resumen del back
const VIEWS = [
  { id: 'proximas', label: 'Próximas', count: 'upcomingSessions', empty: 'No tiene fechas próximas. Sumá una para que puedan reservar.' },
  { id: 'pasadas', label: 'Pasadas', count: 'finishedSessions', empty: 'Todavía no pasó ninguna fecha.' },
  { id: 'canceladas', label: 'Canceladas', count: 'cancelledSessions', empty: 'No cancelaste ninguna fecha.' },
]

/**
 * "Fechas y huéspedes" de UNA experiencia: sus fechas separadas en próximas, pasadas y canceladas.
 * Cada fecha se despliega y muestra quién reservó (las reservas ya están en el store: GET /bookings/sales).
 * Crear, editar, cancelar, borrar y reembolsar se despachan al store: los reducers actualizan la lista
 * y el resumen se vuelve a pedir al back la próxima vez que se muestre.
 */
function HostExperienceAgenda({ experience, sessions, bookings }) {
  const dispatch = useDispatch()
  const summary = useSelector((state) => state.sessions.agenda.items.find((item) => item.experienceId === experience.id))
  const [view, setView] = useState('proximas')
  // Desplegadas: arranca abierta la próxima fecha
  const [open, setOpen] = useState(() => {
    const next = sessions.find((session) => statusOf(session).view === 'proximas')
    return next ? [next.id] : []
  })
  const [editing, setEditing] = useState(null) // fecha, 'new' o null
  const [cancelling, setCancelling] = useState(null)
  const [removing, setRemoving] = useState(null)
  const [refunding, setRefunding] = useState(null)

  // Las próximas de la más cercana a la más lejana; las pasadas y canceladas, la más reciente primero
  const visible = sessions.filter((session) => statusOf(session).view === view)
  if (view !== 'proximas') visible.reverse()
  const guestsOf = (session) => bookings.filter((booking) => booking.experienceSessionId === session.id)
  const toggle = (id) => setOpen(open.includes(id) ? open.filter((entry) => entry !== id) : [...open, id])

  // Cada acción muestra el mensaje del back si sale mal (action.error.message, como en el reducer)
  const run = (action, message) =>
    dispatch(action).then((result) => {
      if (result.error) return dispatch(showToast({ message: result.error.message, tone: 'error' }))
      return dispatch(showToast({ message, tone: 'info' }))
    })

  return (
    <div className="stack">
      <Button variant="ghost" size="sm" icon={ArrowLeft} to="/anfitrion/fechas" className="agenda-back">
        Todas mis experiencias
      </Button>

      <header className="card agenda-header">
        <div>
          <span className="eyebrow">Fechas y huéspedes</span>
          <h2>{experience.title}</h2>
          {summary && (
            <p className="muted small">
              {summary.capacity > 0
                ? `${pluralize(summary.bookedSeats, 'huésped', 'huéspedes')} en las próximas fechas · ${summary.occupancyPercent}% ocupado`
                : 'Sin fechas próximas'}
            </p>
          )}
        </div>
        <div className="row">
          <Button variant="ghost" icon={Eye} to={`/experiencias/${experience.id}`}>
            Ver publicación
          </Button>
          <Button icon={CalendarPlus} onClick={() => setEditing('new')}>
            Nueva fecha
          </Button>
        </div>
      </header>

      <div className="agenda-views" role="tablist" aria-label="Fechas por estado">
        {VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={view === item.id}
            className={`agenda-views__tab ${view === item.id ? 'is-active' : ''}`}
            onClick={() => setView(item.id)}
          >
            {item.label}
            {summary && <span className="agenda-views__count">{summary[item.count]}</span>}
          </button>
        ))}
      </div>

      {visible.length ? (
        <ul className="agenda-sessions">
          {visible.map((session) => {
            const status = statusOf(session)
            const guests = guestsOf(session)
            const isOpen = open.includes(session.id)
            const date = new Date(session.startsAt)
            return (
              <li key={session.id} className={`card agenda-session ${session.editable ? '' : 'is-past'}`}>
                <div className="agenda-session__head">
                  <button type="button" className="agenda-session__toggle" aria-expanded={isOpen} onClick={() => toggle(session.id)}>
                    <span className="agenda-date">
                      <strong>{date.getDate()}</strong>
                      <span>{date.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')}</span>
                    </span>
                    <span className="agenda-session__when">
                      <strong>{formatWeekdayDate(session.startsAt)}</strong>
                      <small className="muted">{formatTimeRange(session.startsAt, session.endsAt)}</small>
                      <span className="row">
                        <Badge tone={status.tone}>{status.label}</Badge>
                        {session.waitlistCount > 0 && (
                          <Badge tone="warning">
                            <BellRing size={12} aria-hidden />
                            {session.waitlistCount} en lista de espera
                          </Badge>
                        )}
                      </span>
                    </span>
                    <CapacityBar session={session} />
                    <ChevronDown className={`agenda-session__chevron ${isOpen ? 'is-open' : ''}`} size={20} aria-hidden />
                  </button>
                  <div className="cell-actions">
                    {session.editable ? (
                      <>
                        <IconButton icon={Pencil} label="Editar fecha" variant="ghost" onClick={() => setEditing(session)} />
                        <IconButton icon={CalendarX} label="Cancelar fecha" variant="ghost" onClick={() => setCancelling(session)} />
                      </>
                    ) : (
                      // Cancelada o terminada: ya no se edita, pero se puede sacar del calendario
                      <IconButton icon={Trash2} label="Eliminar fecha" variant="ghost" onClick={() => setRemoving(session)} />
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div className="agenda-session__body">
                    {guests.length ? (
                      <ul className="guest-list">
                        {guests.map((booking) => (
                          <li key={booking.id} className={booking.refunded ? 'is-refunded' : ''}>
                            <Avatar name={booking.buyerName} size="sm" />
                            <span className="guest-list__name">
                              <strong>
                                {booking.giftRecipientName ?? booking.buyerName}
                                {booking.giftRecipientName && (
                                  <small className="muted">
                                    {' '}
                                    <Gift size={12} aria-hidden /> regalo de {booking.buyerName}
                                  </small>
                                )}
                              </strong>
                              <small className="muted">
                                {pluralize(booking.quantity, 'persona')} · {booking.voucherCode} · Recibís {formatMoney(booking.hostEarnings ?? 0)}
                              </small>
                            </span>
                            {booking.refunded ? (
                              <Badge tone="neutral">Reembolsada</Badge>
                            ) : (
                              session.editable && (
                                <Button size="sm" variant="danger" icon={Undo2} onClick={() => setRefunding(booking)}>
                                  Reembolsar
                                </Button>
                              )
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="muted small agenda-session__empty">
                        <Users size={15} aria-hidden /> Nadie reservó esta fecha{session.editable ? ' todavía' : ''}.
                      </p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <EmptyState icon={CalendarX} title="No hay fechas acá" text={VIEWS.find((item) => item.id === view).empty} />
      )}

      {editing && (
        <SessionFormModal
          session={editing === 'new' ? null : editing}
          experiences={[experience]}
          defaultExperienceId={experience.id}
          onClose={() => setEditing(null)}
        />
      )}
      {cancelling && (
        <ConfirmDialog
          title="¿Cancelar esta fecha?"
          message={
            cancelling.capacity - cancelling.availableSeats > 0
              ? 'La fecha deja de estar disponible y se reembolsan automáticamente sus reservas. Cada persona recibe un aviso.'
              : 'La fecha deja de estar disponible para reservar.'
          }
          // El back no la borra: la marca como cancelada (baja lógica) y reembolsa sus reservas. Queda en "Canceladas"
          onConfirm={() => run(cancelSession(cancelling), 'Fecha cancelada')}
          onClose={() => setCancelling(null)}
        />
      )}
      {removing && (
        <ConfirmDialog
          title="¿Eliminar esta fecha?"
          message="Se borra del calendario junto con sus reservas (ya reembolsadas o pasadas). No se puede deshacer."
          onConfirm={() => run(removeSession(removing.id), 'Fecha eliminada')}
          onClose={() => setRemoving(null)}
        />
      )}
      {refunding && (
        <ConfirmDialog
          title="¿Cancelar y reembolsar esta reserva?"
          message={`Se anula el voucher ${refunding.voucherCode} y se le devuelve el dinero a ${refunding.buyerName}.`}
          confirmLabel="Reembolsar"
          onConfirm={() => run(refundBooking(refunding.id), 'Reserva reembolsada: los lugares vuelven a estar disponibles')}
          onClose={() => setRefunding(null)}
        />
      )}
    </div>
  )
}

export default HostExperienceAgenda

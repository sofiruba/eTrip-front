import { useState } from 'react'
import { CalendarPlus, CalendarX, Pencil, Trash2 } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { cancelSession, removeSession } from '../../redux/sessionsSlice'
import { showToast } from '../../redux/toastsSlice'
import { formatTime } from '../../utils/format'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import EmptyState from '../ui/EmptyState'
import FormField from '../ui/FormField'
import IconButton from '../ui/IconButton'
import CapacityBar from './CapacityBar'
import SessionFormModal from './SessionFormModal'
import './HostCalendar.css'

// El estado de cada fecha lo calcula el back (GET /experience-sessions/manage): acá solo se elige el texto y el color
const SESSION_STATUS = {
  PUBLISHED: { label: 'Publicada', tone: 'success' },
  SOLD_OUT: { label: 'Agotada', tone: 'brand' },
  FINISHED: { label: 'Finalizada', tone: 'neutral' },
  CANCELLED: { label: 'Cancelada', tone: 'danger' },
}
const getSessionStatus = (session) => SESSION_STATUS[session.status] ?? SESSION_STATUS.PUBLISHED

// El back dice si la fecha todavía se puede editar o cancelar (activa, sin terminar y futura)
const isEditable = (session) => session.editable
const bookedSeats = (session) => session.capacity - session.availableSeats

/**
 * Fechas de las experiencias. Lo usan el anfitrión y el admin.
 * Cada acción se despacha al store: los reducers actualizan las fechas (calendario y catálogo público) y,
 * si se cancela una fecha, sus reservas quedan reembolsadas. No hace falta volver a pedir nada.
 */
function HostCalendar({ experiences, sessions }) {
  const dispatch = useDispatch()
  const [params, setParams] = useSearchParams()
  const [editing, setEditing] = useState(null) // sesión, 'new' o null
  const [deleting, setDeleting] = useState(null)
  const [removing, setRemoving] = useState(null) // fecha cancelada o terminada que se va a borrar del todo

  const experienceId = Number(params.get('experiencia')) || null
  const visible = sessions.filter((session) => !experienceId || session.experienceId === experienceId)
  const titleOf = (id) => experiences.find((experience) => experience.id === id)?.title

  const askDelete = (session) => {
    if (!isEditable(session)) {
      dispatch(showToast({ message: session.active ? 'No podés cancelar una fecha que ya empezó.' : 'Esta fecha ya está cancelada.', tone: 'error' }))
      return
    }
    setDeleting(session)
  }

  if (!experiences.length) {
    return <EmptyState icon={CalendarX} title="Primero creá una experiencia" text="Después vas a poder sumarle fechas acá." />
  }

  return (
    <div className="stack">
      <div className="host-calendar__toolbar">
        <FormField
          as="select"
          label="Experiencia"
          value={experienceId ?? ''}
          onChange={(event) => setParams(event.target.value ? { experiencia: event.target.value } : {})}
        >
          <option value="">Todas</option>
          {experiences.map((experience) => (
            <option key={experience.id} value={experience.id}>
              {experience.title}
            </option>
          ))}
        </FormField>
        <Button icon={CalendarPlus} onClick={() => setEditing('new')}>
          Nueva sesión
        </Button>
      </div>

      {visible.length ? (
        <ul className="session-list">
          {visible.map((session) => {
            const status = getSessionStatus(session)
            const date = new Date(session.startsAt)
            return (
              <li key={session.id} className={`session-row ${isEditable(session) ? '' : 'is-past'}`}>
                <div className="session-row__date">
                  <strong>{date.getDate()}</strong>
                  <span>{date.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')}</span>
                </div>
                <div className="session-row__info">
                  <div className="row">
                    <h3>{titleOf(session.experienceId)}</h3>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                  <p className="muted small">
                    {date.toLocaleDateString('es-AR', { weekday: 'long' })} · {formatTime(session.startsAt)}
                  </p>
                </div>
                <CapacityBar session={session} />
                <div className="cell-actions">
                  {isEditable(session) ? (
                    <>
                      <IconButton icon={Pencil} label="Editar sesión" variant="ghost" onClick={() => setEditing(session)} />
                      <IconButton icon={Trash2} label="Cancelar sesión" variant="ghost" onClick={() => askDelete(session)} />
                    </>
                  ) : (
                    // Cancelada o terminada: ya no se edita, pero se puede sacar del calendario
                    <IconButton icon={Trash2} label="Eliminar fecha" variant="ghost" onClick={() => setRemoving(session)} />
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <EmptyState icon={CalendarX} title="Sin fechas publicadas" text="Sumá una sesión para que puedan reservar." />
      )}

      {editing && (
        <SessionFormModal
          session={editing === 'new' ? null : editing}
          experiences={experiences}
          defaultExperienceId={experienceId}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="¿Cancelar esta fecha?"
          message={
            bookedSeats(deleting) > 0
              ? `La fecha deja de estar disponible y se reembolsan automáticamente las ${bookedSeats(deleting)} plazas reservadas. Los compradores reciben un aviso.`
              : 'La fecha deja de estar disponible para reservar.'
          }
          // El back no la borra: la marca como cancelada (baja lógica) y reembolsa sus reservas. Queda en el historial
          onConfirm={() =>
            dispatch(cancelSession(deleting))
              .then((action) => {
                // rejected: el back respondió con un error (action.error.message, como en el reducer)
                if (action.error) {
                  return dispatch(showToast({ message: action.error.message, tone: 'error' }))
                }
                return dispatch(showToast({ message: bookedSeats(deleting) > 0 ? 'Fecha cancelada y reservas reembolsadas' : 'Fecha cancelada', tone: 'info' }))
              })
          }
          onClose={() => setDeleting(null)}
        />
      )}
      {removing && (
        <ConfirmDialog
          title="¿Eliminar esta fecha?"
          message="Se borra del calendario junto con sus reservas (ya reembolsadas o pasadas). No se puede deshacer."
          onConfirm={() =>
            dispatch(removeSession(removing.id))
              .then((action) => {
                // rejected: el back respondió con un error (action.error.message, como en el reducer)
                if (action.error) {
                  return dispatch(showToast({ message: action.error.message, tone: 'error' }))
                }
                return dispatch(showToast({ message: 'Fecha eliminada', tone: 'info' }))
              })
          }
          onClose={() => setRemoving(null)}
        />
      )}
    </div>
  )
}

export default HostCalendar

import { useState } from 'react'
import { CalendarPlus, CalendarX, Pencil, Trash2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useCatalog } from '../../hooks/useCatalog'
import { useToast } from '../../hooks/useToast'
import { deleteSession } from '../../services/sessionsService'
import { formatTime, isPast } from '../../utils/format'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import EmptyState from '../ui/EmptyState'
import FormField from '../ui/FormField'
import IconButton from '../ui/IconButton'
import CapacityBar from './CapacityBar'
import SessionFormModal from './SessionFormModal'
import './HostCalendar.css'

// Las fechas llegan de GET /experience-sessions/manage, que también trae las pasadas y las canceladas
function getSessionStatus(session) {
  if (!session.active) return { label: 'Cancelada', tone: 'danger' }
  if (isPast(session.startsAt)) return { label: 'Finalizada', tone: 'neutral' }
  if (!session.availableSeats) return { label: 'Agotada', tone: 'brand' }
  return { label: 'Publicada', tone: 'success' }
}

// Una fecha cancelada o que ya empezó no se puede editar ni cancelar (el back también lo rechaza)
const isEditable = (session) => session.active && !isPast(session.startsAt)
const bookedSeats = (session) => session.capacity - session.availableSeats

/**
 * Fechas de las experiencias. Lo usan el anfitrión y el admin.
 * `setSessions` actualiza la lista del padre; `onChange` avisa que algo cambió (por ejemplo, para recargar reservas).
 */
function HostCalendar({ experiences, sessions, setSessions, onChange }) {
  const notify = useToast()
  const { refreshSessions } = useCatalog() // el catálogo público también tiene que enterarse de los cambios
  const [params, setParams] = useSearchParams()
  const [editing, setEditing] = useState(null) // sesión, 'new' o null
  const [deleting, setDeleting] = useState(null)

  const experienceId = Number(params.get('experiencia')) || null
  const visible = sessions.filter((session) => !experienceId || session.experienceId === experienceId)
  const titleOf = (id) => experiences.find((experience) => experience.id === id)?.title

  const askDelete = (session) => {
    if (!isEditable(session)) {
      notify(session.active ? 'No podés cancelar una fecha que ya empezó.' : 'Esta fecha ya está cancelada.', 'error')
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
                  {isEditable(session) && (
                    <>
                      <IconButton icon={Pencil} label="Editar sesión" variant="ghost" onClick={() => setEditing(session)} />
                      <IconButton icon={Trash2} label="Cancelar sesión" variant="ghost" onClick={() => askDelete(session)} />
                    </>
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
          onSaved={(saved) => {
            // Si ya existía la reemplazamos; si es nueva la agregamos al final
            setSessions((current) =>
              current.some((item) => item.id === saved.id) ? current.map((item) => (item.id === saved.id ? saved : item)) : [...current, saved],
            )
            refreshSessions()
          }}
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
          onConfirm={() =>
            deleteSession(deleting.id)
              .then(() => {
                // El back no la borra: la marca como cancelada y libera los lugares (queda en el historial)
                setSessions((current) =>
                  current.map((item) => (item.id === deleting.id ? { ...item, active: false, availableSeats: item.capacity } : item)),
                )
                refreshSessions()
                if (onChange) onChange()
                notify(bookedSeats(deleting) > 0 ? 'Fecha cancelada y reservas reembolsadas' : 'Fecha cancelada', 'info')
              })
              .catch((deleteError) => notify(deleteError.message, 'error'))
          }
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  )
}

export default HostCalendar

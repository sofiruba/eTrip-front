import { useState } from 'react'
import { CalendarPlus, CalendarX, Pencil, Trash2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../../hooks/useStore'
import { useToast } from '../../hooks/useToast'
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

function getSessionStatus(session) {
  if (isPast(session.startsAt)) return { label: 'Finalizada', tone: 'neutral' }
  if (!session.active) return { label: 'Pausada', tone: 'warning' }
  if (!session.availableSeats) return { label: 'Agotada', tone: 'brand' }
  return { label: 'Publicada', tone: 'success' }
}

function HostCalendar({ experiences, sessions }) {
  const { remove, reload } = useStore()
  const notify = useToast()
  const [params, setParams] = useSearchParams()
  const [editing, setEditing] = useState(null) // sesión, 'new' o null
  const [deleting, setDeleting] = useState(null)

  const experienceId = Number(params.get('experiencia')) || null
  const visible = sessions.filter((session) => !experienceId || session.experienceId === experienceId)
  const titleOf = (id) => experiences.find((experience) => experience.id === id)?.title

  const askDelete = (session) => {
    if (session.availableSeats < session.capacity && !isPast(session.startsAt)) {
      notify('No podés cancelar una sesión con reservas que ya comenzó.', 'error')
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
              <li key={session.id} className={`session-row ${status.label === 'Finalizada' ? 'is-past' : ''}`}>
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
                  <IconButton icon={Pencil} label="Editar sesión" variant="ghost" onClick={() => setEditing(session)} />
                  <IconButton icon={Trash2} label="Eliminar sesión" variant="ghost" onClick={() => askDelete(session)} />
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
          title="¿Eliminar sesión?"
          message="La fecha dejará de estar disponible y se reembolsarán automáticamente todas las reservas futuras de esta sesión."
          onConfirm={async () => {
            try {
              await remove('sessions', deleting.id)
              await reload()
              notify('Sesión cancelada y reservas reembolsadas', 'info')
              setDeleting(null)
            } catch (deleteError) {
              notify(deleteError.message, 'error')
            }
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  )
}

export default HostCalendar

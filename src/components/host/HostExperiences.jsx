import { useState } from 'react'
import { CalendarDays, Eye, Pencil, Plus, Store, Trash2 } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import { useToast } from '../../hooks/useToast'
import ExperienceCard from '../experience/ExperienceCard'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import EmptyState from '../ui/EmptyState'

function HostExperiences({ experiences, bookings }) {
  const { removeExperience } = useStore()
  const notify = useToast()
  const [deleting, setDeleting] = useState(null)

  const hasActiveBookings = (experienceId) =>
    bookings.some((booking) => booking.experienceId === experienceId && !booking.isPast && !booking.refunded)

  const askDelete = (experience) => {
    if (hasActiveBookings(experience.id)) {
      notify('No podés eliminarla: tiene reservas próximas.', 'error')
      return
    }
    setDeleting(experience)
  }

  if (!experiences.length) {
    return (
      <EmptyState icon={Store} title="Todavía no publicaste experiencias" text="Contá qué te gusta hacer y compartilo con la comunidad.">
        <Button icon={Plus} to="/anfitrion/experiencias/nueva">
          Crear mi primera experiencia
        </Button>
      </EmptyState>
    )
  }

  return (
    <>
      <div className="experience-grid">
        {experiences.map((experience) => (
          <ExperienceCard
            key={experience.id}
            experience={experience}
            showFavorite={false}
            footer={
              <>
                <Button size="sm" variant="secondary" icon={Pencil} to={`/anfitrion/experiencias/${experience.id}/editar`}>
                  Editar
                </Button>
                <Button size="sm" variant="ghost" icon={CalendarDays} to={`/anfitrion/calendario?experiencia=${experience.id}`}>
                  Fechas
                </Button>
                <Button size="sm" variant="ghost" icon={Eye} to={`/experiencias/${experience.id}`} aria-label="Ver publicación" />
                <Button size="sm" variant="ghost" icon={Trash2} onClick={() => askDelete(experience)} aria-label="Eliminar" />
              </>
            }
          />
        ))}
      </div>

      {deleting && (
        <ConfirmDialog
          title="¿Eliminar experiencia?"
          message={`“${deleting.title}” y todas sus fechas se van a despublicar.`}
          onConfirm={() => {
            removeExperience(deleting.id)
            notify('Experiencia eliminada', 'info')
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  )
}

export default HostExperiences

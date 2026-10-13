import { useState } from 'react'
import { CalendarDays, Eye, Pencil, Percent, Plus, Store, Trash2 } from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import { deleteExperience } from '../../services/experiencesService'
import ExperienceCard from '../experience/ExperienceCard'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import EmptyState from '../ui/EmptyState'
import DiscountModal from './DiscountModal'

/** Las experiencias del anfitrión. `setExperiences` es la función del padre para actualizar la lista. */
function HostExperiences({ experiences, bookings, setExperiences }) {
  const notify = useToast()
  const [deleting, setDeleting] = useState(null)
  const [discounting, setDiscounting] = useState(null)

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
                <Button size="sm" variant="ghost" icon={Percent} onClick={() => setDiscounting(experience)} aria-label="Descuento" />
                <Button size="sm" variant="ghost" icon={Eye} to={`/experiencias/${experience.id}`} aria-label="Ver publicación" />
                <Button size="sm" variant="ghost" icon={Trash2} onClick={() => askDelete(experience)} aria-label="Eliminar" />
              </>
            }
          />
        ))}
      </div>

      {discounting && (
        <DiscountModal
          experience={discounting}
          onSaved={(updated) => setExperiences((current) => current.map((item) => (item.id === updated.id ? updated : item)))}
          onClose={() => setDiscounting(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="¿Eliminar experiencia?"
          message={`“${deleting.title}” y todas sus fechas se van a despublicar.`}
          onConfirm={() =>
            deleteExperience(deleting.id)
              .then(() => {
                setExperiences((current) => current.filter((item) => item.id !== deleting.id))
                notify('Experiencia eliminada', 'info')
              })
              .catch((error) => notify(error.message, 'error'))
          }
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  )
}

export default HostExperiences

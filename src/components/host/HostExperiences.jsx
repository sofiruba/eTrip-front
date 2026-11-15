import { useState } from 'react'
import { CalendarDays, Eye, Pencil, Percent, Plus, Store, Trash2 } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { deleteExperience } from '../../redux/experiencesSlice'
import { showToast } from '../../redux/toastsSlice'
import ExperienceCard from '../experience/ExperienceCard'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import EmptyState from '../ui/EmptyState'
import DiscountModal from './DiscountModal'

/** Las experiencias del anfitrión. Los cambios se despachan al store: el padre (suscripto) recibe la lista actualizada. */
function HostExperiences({ experiences, bookings }) {
  const dispatch = useDispatch()
  const [deleting, setDeleting] = useState(null)
  const [discounting, setDiscounting] = useState(null)

  const hasActiveBookings = (experienceId) =>
    bookings.some((booking) => booking.experienceId === experienceId && !booking.isPast && !booking.refunded)

  const askDelete = (experience) => {
    if (hasActiveBookings(experience.id)) {
      dispatch(showToast({ message: 'No podés eliminarla: tiene reservas próximas.', tone: 'error' }))
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
        <DiscountModal experience={discounting} onClose={() => setDiscounting(null)} />
      )}

      {deleting && (
        <ConfirmDialog
          title="¿Eliminar experiencia?"
          message={`“${deleting.title}” se elimina junto con sus fechas, sus reservas pasadas y sus reseñas. No se puede deshacer.`}
          // DELETE: los reducers la sacan de las listas (y sus fechas, reservas pasadas y reseñas)
          onConfirm={() =>
            dispatch(deleteExperience(deleting))
              .then((action) => {
                // rejected: el back respondió con un error (action.error.message, como en el reducer)
                if (action.error) {
                  return dispatch(showToast({ message: action.error.message, tone: 'error' }))
                }
                return dispatch(showToast({ message: 'Experiencia eliminada', tone: 'info' }))
              })
          }
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  )
}

export default HostExperiences

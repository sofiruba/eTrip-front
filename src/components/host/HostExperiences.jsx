import { useState } from 'react'
import { CalendarDays, Eye, Pause, Pencil, Percent, Play, Plus, Store, Trash2 } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { deleteExperience, updateExperienceStatus } from '../../redux/experiencesSlice'
import { showToast } from '../../redux/toastsSlice'
import { describeDeletion, describeDeletionResult } from '../../utils/deletion'
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

  // PATCH /experiences/{id}/status: pausada no aparece en el catálogo ni se puede reservar; las reservas que ya había siguen
  const toggleActive = (experience) =>
    dispatch(updateExperienceStatus({ id: experience.id, active: !experience.active }))
      .then((action) => {
        if (action.error) {
          return dispatch(showToast({ message: action.error.message, tone: 'error' }))
        }
        return dispatch(
          showToast({
            message: action.payload.active ? 'Experiencia publicada de nuevo' : 'Experiencia pausada: no aparece en el catálogo',
            tone: 'info',
          }),
        )
      })

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
                <Button size="sm" variant="ghost" icon={CalendarDays} to={`/anfitrion/fechas/${experience.id}`}>
                  Fechas y huéspedes
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={experience.active ? Pause : Play}
                  onClick={() => toggleActive(experience)}
                  aria-label={experience.active ? 'Pausar' : 'Publicar de nuevo'}
                  title={experience.active ? 'Pausar (sale del catálogo)' : 'Publicar de nuevo'}
                />
                <Button size="sm" variant="ghost" icon={Percent} onClick={() => setDiscounting(experience)} aria-label="Descuento" />
                <Button size="sm" variant="ghost" icon={Eye} to={`/experiencias/${experience.id}`} aria-label="Ver publicación" />
                <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setDeleting(experience)} aria-label="Dar de baja" />
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
          title="¿Dar de baja la experiencia?"
          message={describeDeletion(deleting, bookings)}
          confirmLabel="Dar de baja"
          // DELETE: el back reembolsa y avisa a todos; los reducers la sacan de las listas y marcan las reservas como reembolsadas
          onConfirm={() =>
            dispatch(deleteExperience(deleting))
              .then((action) => {
                if (action.error) {
                  return dispatch(showToast({ message: action.error.message, tone: 'error' }))
                }
                return dispatch(showToast({ message: describeDeletionResult(action.payload.result), tone: 'info' }))
              })
          }
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  )
}

export default HostExperiences

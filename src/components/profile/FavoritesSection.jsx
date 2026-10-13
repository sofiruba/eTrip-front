import { Heart } from 'lucide-react'
import ExperienceCard from '../experience/ExperienceCard'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'
import SectionHeader from '../ui/SectionHeader'

/** Experiencias que el usuario guardó con el corazón. */
function FavoritesSection({ experiences }) {
  return (
    <section className="section">
      <SectionHeader eyebrow="Guardados" title="Planes que te gustaron" />
      {experiences.length ? (
        <div className="experience-grid">
          {experiences.map((experience) => (
            <ExperienceCard key={experience.id} experience={experience} />
          ))}
        </div>
      ) : (
        <EmptyState icon={Heart} title="Todavía no guardaste planes" text="Tocá el corazón de una experiencia para guardarla acá.">
          <Button to="/" variant="secondary">
            Explorar experiencias
          </Button>
        </EmptyState>
      )}
    </section>
  )
}

export default FavoritesSection

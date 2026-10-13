import { ArrowRight } from 'lucide-react'
import ExperienceCard from '../experience/ExperienceCard'
import Button from '../ui/Button'
import SectionHeader from '../ui/SectionHeader'

/** "Planes con descuento". `onSeeAll` filtra el catálogo por ofertas. */
function DealsSection({ deals, onSeeAll }) {
  if (!deals.length) return null

  return (
    <section className="section">
      <SectionHeader eyebrow="Ofertas" title="Planes con descuento">
        <Button variant="ghost" size="sm" iconRight={ArrowRight} onClick={onSeeAll}>
          Ver todas
        </Button>
      </SectionHeader>
      <div className="experience-grid">
        {deals.map((experience) => (
          <ExperienceCard key={experience.id} experience={experience} />
        ))}
      </div>
    </section>
  )
}

export default DealsSection

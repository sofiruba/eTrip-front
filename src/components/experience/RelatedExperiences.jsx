import SectionHeader from '../ui/SectionHeader'
import ExperienceCard from './ExperienceCard'

const MAX_RELATED = 3

/** "También te puede gustar": otras con fechas disponibles, primero las de la misma categoría. */
function RelatedExperiences({ experience, catalog }) {
  const related = catalog
    .filter((entry) => entry.id !== experience.id && entry.nextSession)
    .sort((a, b) => Number(b.categoryId === experience.categoryId) - Number(a.categoryId === experience.categoryId))
    .slice(0, MAX_RELATED)

  if (!related.length) return null

  return (
    <section className="section">
      <SectionHeader eyebrow="Seguí explorando" title="También te puede gustar" />
      <div className="experience-grid">
        {related.map((entry) => (
          <ExperienceCard key={entry.id} experience={entry} />
        ))}
      </div>
    </section>
  )
}

export default RelatedExperiences

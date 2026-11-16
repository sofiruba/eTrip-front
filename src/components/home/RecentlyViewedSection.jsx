import ExperienceCard from '../experience/ExperienceCard'
import SectionHeader from '../ui/SectionHeader'

const MAX_RECENT = 4

/** "Vistos recientemente": los ids están en el slice recentlyViewed (persistido); las tarjetas salen del catálogo. */
function RecentlyViewedSection({ ids, experiences }) {
  const recent = ids
    .map((id) => experiences.find((experience) => experience.id === id))
    .filter(Boolean)
    .slice(0, MAX_RECENT)

  if (recent.length < 2) return null

  return (
    <section className="section">
      <SectionHeader eyebrow="Seguí donde lo dejaste" title="Vistos recientemente" />
      <div className="experience-grid">
        {recent.map((experience) => (
          <ExperienceCard key={experience.id} experience={experience} />
        ))}
      </div>
    </section>
  )
}

export default RecentlyViewedSection

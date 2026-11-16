import { ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import ExperienceCard from '../experience/ExperienceCard'
import Button from '../ui/Button'
import SectionHeader from '../ui/SectionHeader'

const MAX_FOR_YOU = 4

/**
 * "Para vos": experiencias con fechas disponibles que comparten algún interés (tag) con los del usuario.
 * Todo sale del store: los intereses del usuario (slice auth) y el catálogo con sus tags (slice experiences).
 * Primero las que coinciden en más intereses. Sin intereses, invita a elegirlos en el perfil.
 */
function ForYouSection({ experiences, interests, onSeeAll }) {
  if (!interests.length) {
    return (
      <section className="section card for-you__empty">
        <Sparkles size={22} aria-hidden />
        <div>
          <h2>Contanos qué te gusta</h2>
          <p className="muted small">
            Elegí tus intereses y te mostramos planes para vos. <Link to="/perfil">Elegir intereses</Link>
          </p>
        </div>
      </section>
    )
  }

  const matches = experiences
    .filter((experience) => experience.nextSession)
    .map((experience) => ({ experience, hits: experience.tags.filter((tag) => interests.includes(tag)).length }))
    .filter((entry) => entry.hits > 0)
    .sort((a, b) => b.hits - a.hits || b.experience.averageRating - a.experience.averageRating)

  if (!matches.length) return null

  return (
    <section className="section">
      <SectionHeader eyebrow="Para vos" title="Según tus intereses" description={`Porque te gusta ${interests.slice(0, 3).join(', ').toLowerCase()}.`}>
        <Button variant="ghost" size="sm" iconRight={ArrowRight} onClick={onSeeAll}>
          Ver todas
        </Button>
      </SectionHeader>
      <div className="experience-grid">
        {matches.slice(0, MAX_FOR_YOU).map(({ experience }) => (
          <ExperienceCard key={experience.id} experience={experience} />
        ))}
      </div>
    </section>
  )
}

export default ForYouSection

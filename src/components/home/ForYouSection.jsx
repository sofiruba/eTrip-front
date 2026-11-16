import { ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import ExperienceCard from '../experience/ExperienceCard'
import Button from '../ui/Button'
import SectionHeader from '../ui/SectionHeader'

const MAX_FOR_YOU = 4

/**
 * "Para vos": las recomendaciones que calcula el back (GET /experiences/recommended) con los intereses del usuario,
 * lo que guardó, lo que reservó y lo que vio. Cada tarjeta muestra el motivo que manda el back.
 * Este componente solo las muestra (la página las pide y les suma la próxima fecha del catálogo).
 */
function ForYouSection({ recommendations, hasInterests, onSeeAll }) {
  if (!recommendations.length) {
    return (
      <section className="section card for-you__empty">
        <Sparkles size={22} aria-hidden />
        <div>
          {hasInterests ? (
            <>
              <h2>Todavía no hay planes con fecha para tus intereses</h2>
              <p className="muted small">
                Sumá algunos más y te mostramos otros planes. <Link to="/perfil">Elegir intereses</Link>
              </p>
            </>
          ) : (
            <>
              <h2>Contanos qué te gusta</h2>
              <p className="muted small">
                Elegí tus intereses (o guardá planes con el ♥) y te recomendamos experiencias. <Link to="/perfil">Elegir intereses</Link>
              </p>
            </>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <SectionHeader eyebrow="Para vos" title="Elegidos para vos" description="Según tus intereses y los planes que guardaste, reservaste o miraste.">
        {hasInterests && (
          <Button variant="ghost" size="sm" iconRight={ArrowRight} onClick={onSeeAll}>
            Ver todo de tus intereses
          </Button>
        )}
      </SectionHeader>
      <div className="experience-grid">
        {recommendations.slice(0, MAX_FOR_YOU).map(({ experience, reason }) => (
          <ExperienceCard
            key={experience.id}
            experience={experience}
            footer={
              <p className="for-you__reason">
                <Sparkles size={14} aria-hidden />
                {reason}
              </p>
            }
          />
        ))}
      </div>
    </section>
  )
}

export default ForYouSection

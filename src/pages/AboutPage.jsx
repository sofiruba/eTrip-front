import { ArrowRight, Footprints, Sparkles, Users } from 'lucide-react'
import Button from '../components/ui/Button'
import SectionHeader from '../components/ui/SectionHeader'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import './AboutPage.css'

const VALUES = [
  {
    icon: Sparkles,
    title: 'Planes, no paquetes',
    text: 'No vendemos escapadas prefabricadas. Te ayudamos a encontrar algo que realmente tengas ganas de hacer.',
  },
  {
    icon: Users,
    title: 'Gente real',
    text: 'Cada experiencia la propone alguien que sabe, disfruta y tiene algo para compartir.',
  },
  {
    icon: Footprints,
    title: 'Menos scrollear',
    text: 'Más salir de casa, conocer gente y volver con una anécdota que no empiece con “vi un reel de...”.',
  },
]

function AboutPage() {
  useDocumentTitle('Sobre nosotros')
  return (
    <div className="container page">
      <section className="about__hero">
        <span className="eyebrow">Sobre PLAN</span>
        <h1>
          No hacemos viajes. <em>Hacemos que salgas.</em>
        </h1>
        <p className="about__lead">
          PLAN nació para encontrar esos planes que siempre decís que vas a hacer “algún día”. Ese día puede ser hoy.
        </p>
      </section>

      <blockquote className="about__quote">
        <p>Una plataforma para hacer cerámica, remar, comer rico, conocer gente y dejar de responder “vemos” en el grupo.</p>
        <footer>— El equipo de PLAN, probablemente buscando un plan</footer>
      </blockquote>

      <section className="section">
        <SectionHeader eyebrow="Por qué existimos" title="La vida pide planes." />
        <div className="about__values">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <article key={title} className="card">
              <span className="about__icon">
                <Icon size={22} aria-hidden />
              </span>
              <h3>{title}</h3>
              <p className="muted">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section about__cta">
        <h2>¿Ya encontraste tu próximo plan?</h2>
        <div className="row">
          <Button to="/" iconRight={ArrowRight}>
            Explorar experiencias
          </Button>
          <Button to="/anfitrion" variant="secondary">
            Quiero ser anfitrión
          </Button>
        </div>
      </section>
    </div>
  )
}

export default AboutPage

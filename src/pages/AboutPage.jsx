import { ArrowRight, Compass, Footprints, HandHeart, Sparkle, Sparkles, Users } from 'lucide-react'
import Button from '../components/ui/Button'
import SectionHeader from '../components/ui/SectionHeader'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useReveal } from '../hooks/useReveal'
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

// Las dos filas de planes que pasan por la pantalla (van en sentidos opuestos)
const MARQUEE = [
  ['Cerámica', 'Remar en el Delta', 'Tango en un bodegón', 'Cata de vinos', 'Empanadas salteñas', 'Fotografía analógica', 'Mate con locales'],
  ['Trekking', 'Arte callejero', 'Clase de folklore', 'Cocina de abuela', 'Feria de barrio', 'Yoga al aire libre', 'Historia del barrio'],
]

function Marquee() {
  return (
    <div className="about__marquee" aria-hidden>
      {MARQUEE.map((row, index) => (
        <div key={index} className={`about__marquee-row ${index % 2 ? 'is-reverse' : ''}`}>
          {/* El contenido va dos veces para que la vuelta no se note */}
          {[0, 1].map((copy) => (
            <div key={copy} className="about__marquee-track">
              {row.map((item) => (
                <span key={item} className="about__marquee-item">
                  {item}
                  <Sparkle size={14} fill="currentColor" />
                </span>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function AboutPage() {
  useDocumentTitle('Sobre nosotros')
  const pageRef = useReveal()

  return (
    <div className="container page about" ref={pageRef}>
      <section className="about__hero">
        <span className="eyebrow">Sobre PLAN</span>
        <h1>
          <span className="about__line">No hacemos viajes.</span> <em className="about__line">Hacemos que salgas.</em>
        </h1>
        <p className="about__lead">
          PLAN nació para encontrar esos planes que siempre decís que vas a hacer “algún día”. Ese día puede ser hoy.
        </p>
      </section>

      <Marquee />

      <blockquote className="about__quote" data-reveal>
        <p>Una plataforma para hacer cerámica, remar, comer rico, conocer gente y dejar de responder “vemos” en el grupo.</p>
        <footer>— El equipo de PLAN, probablemente buscando un plan</footer>
      </blockquote>

      <section className="section">
        <div data-reveal>
          <SectionHeader eyebrow="Lo que hacemos" title="Unimos a los que saben con los que quieren descubrir." />
          <p className="about__intro muted">
            La mejor forma de conocer un lugar es a través de su gente. En PLAN, locales que saben hacer algo (cocinar, remar,
            pintar, contar la historia de su barrio) lo comparten con quienes quieren aprender, probar algo nuevo o conocer la
            ciudad desde adentro.
          </p>
        </div>

        <div className="about__bridge">
          <article className="about__side card" data-reveal>
            <span className="about__icon">
              <HandHeart size={22} aria-hidden />
            </span>
            <h3>Los que saben</h3>
            <p className="muted">
              Cocineras, ceramistas, guías, músicos y vecinos con algo para compartir. Proponen el plan y lo hacen a su manera.
            </p>
          </article>

          <div className="about__link" data-reveal style={{ '--reveal-delay': '150ms' }} aria-hidden>
            <span className="about__wire" />
            <span className="about__hub">
              <Sparkle size={20} fill="currentColor" />
            </span>
            <span className="about__wire" />
          </div>

          <article className="about__side card" data-reveal style={{ '--reveal-delay': '300ms' }}>
            <span className="about__icon">
              <Compass size={22} aria-hidden />
            </span>
            <h3>Los que quieren descubrir</h3>
            <p className="muted">
              Viajeros, curiosos y gente de la ciudad con ganas de aprender, probar algo distinto y conocer la cultura de cerca.
            </p>
          </article>
        </div>
      </section>

      <section className="section">
        <div data-reveal>
          <SectionHeader eyebrow="Por qué existimos" title="La vida pide planes." />
        </div>
        <div className="about__values">
          {VALUES.map(({ icon: Icon, title, text }, index) => (
            <div key={title} data-reveal style={{ '--reveal-delay': `${index * 120}ms` }}>
              <article className="about__value card">
                <span className="about__icon">
                  <Icon size={22} aria-hidden />
                </span>
                <h3>{title}</h3>
                <p className="muted">{text}</p>
              </article>
            </div>
          ))}
        </div>
      </section>

      <section className="section about__cta" data-reveal>
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

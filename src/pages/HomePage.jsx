import { ArrowDown, SearchX } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import UpcomingPlans from '../components/booking/UpcomingPlans'
import CategoryFilter from '../components/experience/CategoryFilter'
import ExperienceCard from '../components/experience/ExperienceCard'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import SectionHeader from '../components/ui/SectionHeader'
import { filterExperiences, getBookings, splitBookings } from '../data/selectors'
import { useAuth } from '../hooks/useAuth'
import { useStore } from '../hooks/useStore'
import { pluralize } from '../utils/format'
import './HomePage.css'

function HomePage() {
  const { db, experiences } = useStore()
  const { user, openAuth } = useAuth()
  const [params, setParams] = useSearchParams()

  const query = params.get('q') ?? ''
  const categoryId = Number(params.get('categoria')) || null
  const filtered = filterExperiences(experiences, { query, categoryId })
  const upcoming = user ? splitBookings(getBookings(db, (booking) => booking.buyerId === user.id)).upcoming : []

  const updateParam = (key, value) =>
    setParams(
      (current) => {
        if (value) current.set(key, value)
        else current.delete(key)
        return current
      },
      { preventScrollReset: true },
    )

  const scrollToExperiences = () => document.getElementById('experiencias')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="container home">
      <section className="hero">
        <span className="eyebrow">Experiencias curadas para vos</span>
        <h1>
          Tu próximo <em>plan empieza acá.</em>
        </h1>
        <p className="hero__lead">
          Descubrí experiencias con gente copada, elegí una fecha y reservá tu lugar para hacer algo distinto.
        </p>
        <div className="hero__actions">
          <Button iconRight={ArrowDown} onClick={scrollToExperiences}>
            Explorar experiencias
          </Button>
          {user ? (
            <Button variant="ghost" to="/anfitrion">
              Publicá tu experiencia
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => openAuth('register')}>
              Crear una cuenta
            </Button>
          )}
        </div>
        <div className="hero__stamp" aria-hidden>
          <span>PLAN</span>
          <strong>Hacé algo que te haga bien.</strong>
          <small>Buenos Aires</small>
        </div>
      </section>

      {upcoming.length > 0 && <UpcomingPlans bookings={upcoming} />}

      <section className="section" id="experiencias">
        <SectionHeader eyebrow="Explorá" title={query ? `Resultados para “${query}”` : '¿Qué plan pinta?'}>
          <span className="muted small">{pluralize(filtered.length, 'experiencia')}</span>
        </SectionHeader>

        <CategoryFilter
          categories={db.categories}
          value={categoryId}
          onChange={(id) => updateParam('categoria', id)}
        />

        {filtered.length ? (
          <div className="experience-grid home__grid">
            {filtered.map((experience) => (
              <ExperienceCard key={experience.id} experience={experience} />
            ))}
          </div>
        ) : (
          <EmptyState icon={SearchX} title="No encontramos ese plan" text="Probá con otra búsqueda o categoría.">
            <Button variant="secondary" onClick={() => setParams({})}>
              Limpiar filtros
            </Button>
          </EmptyState>
        )}
      </section>
    </div>
  )
}

export default HomePage

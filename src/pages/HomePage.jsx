import { ArrowRight, SearchX } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import UpcomingPlans from '../components/booking/UpcomingPlans'
import CatalogFilters from '../components/experience/CatalogFilters'
import CategoryFilter from '../components/experience/CategoryFilter'
import ExperienceCard from '../components/experience/ExperienceCard'
import HeroSearch from '../components/search/HeroSearch'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import SectionHeader from '../components/ui/SectionHeader'
import {
  filterExperiences,
  getAvailableDates,
  getBookings,
  getDestinations,
  sortExperiences,
  splitBookings,
} from '../data/selectors'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useStore } from '../hooks/useStore'
import { applyFilters, PAGE_SIZE, readFilters } from '../utils/catalogFilters'
import { matchesLocation } from '../utils/location'
import './HomePage.css'

const MAX_DEALS = 4

function HomePage() {
  const { db, experiences } = useStore()
  const { user, isAdmin, openAuth } = useAuth()
  const [params, setParams] = useSearchParams()
  useDocumentTitle(null)

  const filters = readFilters(params)
  const results = sortExperiences(filterExperiences(db, experiences, filters), filters.sort)
  const visible = results.slice(0, (filters.page + 1) * PAGE_SIZE)
  const hasFilters = [...params.keys()].some((key) => !['orden', 'page'].includes(key))
  const deals = experiences.filter((experience) => experience.discountPercentage > 0 && experience.nextSession).slice(0, MAX_DEALS)
  const destinations = getDestinations(experiences)
  const availableDates = getAvailableDates(db.sessions)
  // Si se buscó una ciudad donde todavía no hay nada, el vacío invita a publicar
  const placeIsEmpty = Boolean(filters.location) && !experiences.some((experience) => matchesLocation(experience.location, filters.location))
  const upcoming = user ? splitBookings(getBookings(db, (booking) => booking.buyerId === user.id)).upcoming : []
  // Las tarjetas llevan la cantidad de personas buscada, así el detalle ya la tiene elegida
  const cardLink = (experience) => `/experiencias/${experience.id}${filters.guests ? `?personas=${filters.guests}` : ''}`

  // Cualquier cambio de filtro vuelve a la primera página
  const updateFilters = (patch, options) =>
    setParams((current) => applyFilters(current, patch, options), { preventScrollReset: true })

  const clearFilters = () => setParams(filters.sort ? { orden: filters.sort } : {}, { preventScrollReset: true })

  const scrollToExperiences = () =>
    window.setTimeout(() => document.getElementById('experiencias')?.scrollIntoView({ behavior: 'smooth' }), 50)

  const sectionTitle = filters.location ? `Planes en ${filters.location}` : filters.title ? `Resultados para “${filters.title}”` : '¿Qué plan pinta?'

  return (
    <div className="container home">
      <section className="hero">
        <span className="eyebrow">Experiencias para salir de la rutina</span>
        <h1>
          Hacé un plan <em>distinto.</em>
        </h1>
        <p className="hero__lead">
          Descubrí experiencias nuevas, elegí una fecha y reservá tu lugar. En tu ciudad o en la que estés de viaje, siempre
          hay algo distinto para hacer.
        </p>
        <HeroSearch
          id="hero-search"
          value={filters}
          destinations={destinations}
          availableDates={availableDates}
          experiences={experiences}
          onSearch={(search) => {
            updateFilters(search)
            scrollToExperiences()
          }}
        />
      </section>

      {upcoming.length > 0 && <UpcomingPlans bookings={upcoming} />}

      <section className="section" id="experiencias">
        <SectionHeader eyebrow="Explorá" title={sectionTitle} />

        <CategoryFilter
          categories={db.categories}
          value={filters.categoryId}
          onChange={(id) => updateFilters({ categoryId: id })}
        />

        <CatalogFilters
          filters={filters}
          categories={db.categories}
          resultCount={results.length}
          onChange={updateFilters}
          onClear={clearFilters}
        />

        {results.length ? (
          <>
            <div className="experience-grid home__grid">
              {visible.map((experience) => (
                <ExperienceCard key={experience.id} experience={experience} to={cardLink(experience)} />
              ))}
            </div>
            {visible.length < results.length && (
              <div className="home__more">
                <p className="muted small">
                  Viendo {visible.length} de {results.length}
                </p>
                <Button variant="secondary" onClick={() => updateFilters({ page: filters.page + 1 }, { keepPage: true })}>
                  Cargar más
                </Button>
              </div>
            )}
          </>
        ) : placeIsEmpty ? (
          <EmptyState
            icon={SearchX}
            title={`Todavía no hay planes en ${filters.location}`}
            text="Estamos empezando por Buenos Aires. ¿Sos de ahí? Podés publicar la primera experiencia."
          >
            <Button to="/anfitrion/experiencias/nueva">Publicar una experiencia</Button>
            <Button variant="secondary" onClick={clearFilters}>
              Ver todas
            </Button>
          </EmptyState>
        ) : (
          <EmptyState icon={SearchX} title="No encontramos ese plan" text="Probá con otras fechas o sacando algún filtro.">
            <Button variant="secondary" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          </EmptyState>
        )}
      </section>

      {!hasFilters && deals.length > 0 && (
        <section className="section">
          <SectionHeader eyebrow="Ofertas" title="Planes con descuento">
            <Button
              variant="ghost"
              size="sm"
              iconRight={ArrowRight}
              onClick={() => {
                updateFilters({ onlyDiscounted: true })
                scrollToExperiences()
              }}
            >
              Ver todas
            </Button>
          </SectionHeader>
          <div className="experience-grid">
            {deals.map((experience) => (
              <ExperienceCard key={experience.id} experience={experience} />
            ))}
          </div>
        </section>
      )}

      {!isAdmin && (
        <section className="section home__host card">
          <div>
            <span className="eyebrow">Sé anfitrión</span>
            <h2>¿Tenés algo para compartir?</h2>
            <p className="muted">
              Una terraza linda, un oficio, el barrio que conocés de memoria. Cualquiera puede armar un plan en PLAN y recibir a
              gente de su ciudad o de visita.
            </p>
          </div>
          <Button
            iconRight={ArrowRight}
            {...(user ? { to: '/anfitrion' } : { onClick: () => openAuth('register', '/anfitrion') })}
          >
            Publicá tu experiencia
          </Button>
        </section>
      )}
    </div>
  )
}

export default HomePage

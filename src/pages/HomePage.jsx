import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import UpcomingPlans from '../components/booking/UpcomingPlans'
import CatalogFilters from '../components/experience/CatalogFilters'
import CategoryFilter from '../components/experience/CategoryFilter'
import CatalogResults from '../components/home/CatalogResults'
import DealsSection from '../components/home/DealsSection'
import HomeHero from '../components/home/HomeHero'
import HostInvite from '../components/home/HostInvite'
import SectionHeader from '../components/ui/SectionHeader'
import { useAuth } from '../hooks/useAuth'
import { useCatalog } from '../hooks/useCatalog'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { getBookings } from '../services/bookingsService'
import { searchExperiences } from '../services/experiencesService'
import { addBookingInfo, splitBookings } from '../utils/bookings'
import { applyFilters, PAGE_SIZE, readFilters, toBackQuery, withoutBackFilters } from '../utils/catalogFilters'
import { addSessionInfo, filterExperiences, sortExperiences } from '../utils/experiences'
import { matchesLocation } from '../utils/location'
import './HomePage.css'

const MAX_DEALS = 4

/** Inicio: buscador, próximos planes, catálogo con filtros (guardados en la URL) y ofertas. */
function HomePage() {
  const { experiences, sessions, categories, loading, error, reload } = useCatalog()
  const { user, isAdmin } = useAuth()
  const [params, setParams] = useSearchParams()
  const [myBookings, setMyBookings] = useState([])
  // Última búsqueda que respondió el back: { query, results, error }
  const [search, setSearch] = useState({ query: '', results: [], error: '' })
  const [attempt, setAttempt] = useState(0) // "Reintentar" lo incrementa para repetir la búsqueda
  const resultsRef = useRef(null)
  useDocumentTitle(null)

  const filters = readFilters(params)
  const backQuery = toBackQuery(filters)

  // Filtros que resuelve el back: cada vez que cambian (están en el array de dependencias) se vuelve a pedir
  // la lista. Si cambian antes de que llegue la respuesta, la vieja se descarta en el return (limpieza).
  useEffect(() => {
    if (!backQuery) return undefined
    let ignore = false
    searchExperiences(backQuery)
      .then((results) => {
        if (!ignore) setSearch({ query: backQuery, results, error: '' })
      })
      .catch((searchError) => {
        if (!ignore) setSearch({ query: backQuery, results: [], error: searchError.message })
      })
    return () => {
      ignore = true
    }
  }, [backQuery, attempt])

  // Las reservas del usuario se piden cuando inicia sesión (por eso userId va en las dependencias)
  const userId = user?.id
  useEffect(() => {
    if (!userId || isAdmin) return
    getBookings()
      .then((data) => setMyBookings(data))
      .catch((error) => console.error('Error al traer tus reservas:', error))
  }, [userId, isAdmin])

  // Sin filtros del back se usa el catálogo que ya está cargado (no hace falta otro pedido)
  const searching = Boolean(backQuery) && search.query !== backQuery
  const base = backQuery ? addSessionInfo(searching ? [] : search.results, sessions) : experiences
  const frontFilters = backQuery ? withoutBackFilters(filters) : filters
  const results = sortExperiences(filterExperiences(base, sessions, frontFilters), filters.sort)
  const visible = results.slice(0, (filters.page + 1) * PAGE_SIZE)
  const hasFilters = [...params.keys()].some((key) => !['orden', 'page'].includes(key))
  const deals = experiences.filter((experience) => experience.discountPercentage > 0 && experience.nextSession).slice(0, MAX_DEALS)
  const upcoming = user ? splitBookings(addBookingInfo(myBookings, experiences)).upcoming : []
  const sectionTitle = filters.location ? `Planes en ${filters.location}` : filters.title ? `Resultados para “${filters.title}”` : '¿Qué plan pinta?'

  // Cualquier cambio de filtro vuelve a la primera página
  const updateFilters = (patch, options) => setParams((current) => applyFilters(current, patch, options), { preventScrollReset: true })
  const clearFilters = () => setParams(filters.sort ? { orden: filters.sort } : {}, { preventScrollReset: true })
  // Espera a que se aplique el filtro y baja hasta los resultados (con una ref, sin buscar en el DOM)
  const scrollToExperiences = () => window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

  return (
    <div className="container home">
      <HomeHero
        filters={filters}
        experiences={experiences}
        sessions={sessions}
        onSearch={(search) => {
          updateFilters(search)
          scrollToExperiences()
        }}
      />

      {upcoming.length > 0 && <UpcomingPlans bookings={upcoming} />}

      <section className="section" id="experiencias" ref={resultsRef}>
        <SectionHeader eyebrow="Explorá" title={sectionTitle} />
        <CategoryFilter categories={categories} value={filters.categoryId} onChange={(id) => updateFilters({ categoryId: id })} />
        <CatalogFilters filters={filters} categories={categories} resultCount={results.length} onChange={updateFilters} onClear={clearFilters} />
        <CatalogResults
          loading={loading || searching}
          error={error || (backQuery ? search.error : '')}
          onRetry={() => {
            reload()
            setAttempt((current) => current + 1)
          }}
          visible={visible}
          total={results.length}
          location={filters.location}
          placeIsEmpty={Boolean(filters.location) && !experiences.some((experience) => matchesLocation(experience.location, filters.location))}
          // Las tarjetas llevan la cantidad de personas buscada, así el detalle ya la tiene elegida
          cardLink={(experience) => `/experiencias/${experience.id}${filters.guests ? `?personas=${filters.guests}` : ''}`}
          onMore={() => updateFilters({ page: filters.page + 1 }, { keepPage: true })}
          onClear={clearFilters}
        />
      </section>

      {!hasFilters && (
        <DealsSection
          deals={deals}
          onSeeAll={() => {
            updateFilters({ onlyDiscounted: true })
            scrollToExperiences()
          }}
        />
      )}

      {!isAdmin && <HostInvite />}
    </div>
  )
}

export default HomePage

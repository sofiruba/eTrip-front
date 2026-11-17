import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import UpcomingPlans from '../components/booking/UpcomingPlans'
import CatalogFilters from '../components/experience/CatalogFilters'
import CategoryFilter from '../components/experience/CategoryFilter'
import CatalogResults from '../components/home/CatalogResults'
import DealsSection from '../components/home/DealsSection'
import ForYouSection from '../components/home/ForYouSection'
import HomeHero from '../components/home/HomeHero'
import HomeStats from '../components/home/HomeStats'
import HostInvite from '../components/home/HostInvite'
import RecentlyViewedSection from '../components/home/RecentlyViewedSection'
import SectionHeader from '../components/ui/SectionHeader'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { fetchBookings } from '../redux/bookingsSlice'
import { fetchCategories } from '../redux/categoriesSlice'
import { fetchExperiences, fetchRecommendations, searchExperiences } from '../redux/experiencesSlice'
import { isMissing } from '../redux/helpers'
import { fetchSessions } from '../redux/sessionsSlice'
import { addBookingInfo, splitBookings } from '../utils/bookings'
import { applyFilters, PAGE_SIZE, readFilters, toBackQuery } from '../utils/catalogFilters'
import { addSessionInfo, sortExperiences } from '../utils/experiences'
import { matchesLocation } from '../utils/location'
import './HomePage.css'

const MAX_DEALS = 4

/** Inicio: buscador, próximos planes, "Para vos", catálogo con filtros (guardados en la URL), vistos recientemente y ofertas. */
function HomePage() {
  const dispatch = useDispatch()
  // El catálogo ya está en el store (se pidió una sola vez al abrir la app, en App.jsx)
  const catalog = useSelector((state) => state.experiences)
  const sessionsState = useSelector((state) => state.sessions)
  const categoriesState = useSelector((state) => state.categories)
  const sessions = sessionsState.items
  const categories = categoriesState.items
  // Cada experiencia con la info de sus fechas (próxima fecha con lugar, lugares que quedan)
  const experiences = addSessionInfo(catalog.items, sessions)
  const error = catalog.error || sessionsState.error || categoriesState.error
  const loading = !error && (!catalog.loaded || !sessionsState.loaded)
  const user = useSelector((state) => state.auth.user)
  const isAdmin = useSelector((state) => state.auth.user?.role === 'ADMIN')
  const { items: myBookings, loaded: bookingsLoaded } = useSelector((state) => state.bookings)
  const recentIds = useSelector((state) => state.recentlyViewed.ids)
  const recommendations = useSelector((state) => state.experiences.recommended)
  const [params, setParams] = useSearchParams()
  const resultsRef = useRef(null)
  useDocumentTitle(null)

  const filters = readFilters(params)
  const backQuery = toBackQuery(filters)
  // Resultado guardado de esta búsqueda: { items, loading, error }, o undefined si todavía no se pidió
  const search = useSelector((state) => state.experiences.searches[backQuery])

  // Con filtros, la búsqueda la resuelve el back. Cada búsqueda queda guardada en el store con su query:
  // si se vuelve a una que ya se hizo, no se repite el GET.
  useEffect(() => {
    if (backQuery && !search) dispatch(searchExperiences(backQuery))
  }, [backQuery, search, dispatch])

  // Mis reservas (para "Tus próximos planes"): una sola vez, cuando hay un cliente logueado y todavía no las tenemos
  const userId = user?.id
  useEffect(() => {
    if (userId && !isAdmin && !bookingsLoaded) dispatch(fetchBookings())
  }, [userId, isAdmin, bookingsLoaded, dispatch])

  // "Para vos": las recomendaciones las calcula el back. Se piden una vez y otra vez solo si algo las cambió
  // (guardar, quitar, cambiar intereses o comprar: experiencesSlice escucha esas acciones y marca loaded = false).
  // Los "vistos recientemente" viven en este navegador, por eso se los mandamos
  useEffect(() => {
    if (userId && !isAdmin && isMissing(recommendations)) dispatch(fetchRecommendations(recentIds))
  }, [userId, isAdmin, recommendations, recentIds, dispatch])

  // Sin filtros se usa el catálogo que ya está cargado (no hace falta otro pedido).
  // El front no filtra nada: solo ordena lo que mandó el back y lo muestra de a una página ("Ver más")
  const searching = Boolean(backQuery) && (!search || search.loading)
  const base = backQuery ? addSessionInfo(search?.items ?? [], sessions) : experiences
  const results = sortExperiences(base, filters.sort)
  const visible = results.slice(0, (filters.page + 1) * PAGE_SIZE)
  const hasFilters = [...params.keys()].some((key) => !['orden', 'page'].includes(key))
  const deals = experiences.filter((experience) => experience.discountPercentage > 0 && experience.nextSession).slice(0, MAX_DEALS)
  // El admin no compra: sus "reservas" en el store son las de todo el sitio
  const upcoming = user && !isAdmin ? splitBookings(addBookingInfo(myBookings, experiences)).upcoming : []
  const sectionTitle = filters.location
    ? `Planes en ${filters.location}`
    : filters.title
      ? `Resultados para “${filters.title}”`
      : filters.tags.length
        ? `Planes de ${filters.tags.join(', ').toLowerCase()}`
        : '¿Qué plan pinta?'

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

      {!loading && !error && <HomeStats experiences={experiences} />}

      {upcoming.length > 0 && <UpcomingPlans bookings={upcoming} />}

      {/* "Para vos": recomendaciones del back, con la próxima fecha que ya está en el store */}
      {user && !isAdmin && !hasFilters && !loading && recommendations.loaded && (
        <ForYouSection
          recommendations={addSessionInfo(
            recommendations.items.map((recommendation) => recommendation.experience),
            sessions,
          ).map((experience, index) => ({ experience, reason: recommendations.items[index].reason }))}
          hasInterests={(user.interests ?? []).length > 0}
          onSeeAll={() => {
            updateFilters({ tags: user.interests })
            scrollToExperiences()
          }}
        />
      )}

      <section className="section" id="experiencias" ref={resultsRef}>
        <SectionHeader eyebrow="Explorá" title={sectionTitle} />
        <CategoryFilter categories={categories} value={filters.categoryId} onChange={(id) => updateFilters({ categoryId: id })} />
        <CatalogFilters
          filters={filters}
          categories={categories}
          prices={experiences.map((experience) => experience.finalPrice)}
          resultCount={results.length}
          onChange={updateFilters}
          onClear={clearFilters}
        />
        <CatalogResults
          loading={loading || searching}
          error={error || (backQuery ? (search?.error ?? '') : '')}
          // Reintentar: se vuelve a despachar solo lo que falló (lo que ya se cargó bien no se repite)
          onRetry={() => {
            if (catalog.error) dispatch(fetchExperiences())
            if (sessionsState.error) dispatch(fetchSessions())
            if (categoriesState.error) dispatch(fetchCategories())
            if (search?.error) dispatch(searchExperiences(backQuery))
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

      {!hasFilters && <RecentlyViewedSection ids={recentIds} experiences={experiences} />}

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

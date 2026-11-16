import { useEffect, useRef } from 'react'
import { MessageCircle, Share2 } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import BookingPanel from '../components/experience/BookingPanel'
import ExperienceMeta from '../components/experience/ExperienceMeta'
import FavoriteButton from '../components/experience/FavoriteButton'
import Gallery from '../components/experience/Gallery'
import HostCard from '../components/experience/HostCard'
import LocationMap from '../components/experience/LocationMap'
import RelatedExperiences from '../components/experience/RelatedExperiences'
import ReviewsSection from '../components/experience/ReviewsSection'
import StickyBookingBar from '../components/experience/StickyBookingBar'
import TagList from '../components/experience/TagList'
import ErrorState from '../components/ui/ErrorState'
import IconButton from '../components/ui/IconButton'
import Loading from '../components/ui/Loading'
import Notice from '../components/ui/Notice'
import PageHeader from '../components/ui/PageHeader'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useElementOffscreen } from '../hooks/useElementOffscreen'
import { fetchExperienceById } from '../redux/experiencesSlice'
import { addRecentlyViewed } from '../redux/recentlyViewedSlice'
import { experienceKey, fetchReviewsByExperience, replyToReview } from '../redux/reviewsSlice'
import { showToast } from '../redux/toastsSlice'
import { fetchUserById } from '../redux/usersSlice'
import { whatsappUrl } from '../utils/calendar'
import { hoursBetween } from '../utils/dates'
import { addSessionInfo, byNewest, getHostStats, getUpcomingSessions } from '../utils/experiences'
import { formatMoney, pluralize } from '../utils/format'
import { getCity } from '../utils/location'
import NotFoundPage from './NotFoundPage'
import './ExperiencePage.css'

/**
 * Al pasar de una experiencia a otra (por ejemplo, desde "También te puede gustar") cambia el id:
 * con key={id} React monta la página de nuevo.
 */
function ExperienceRoute() {
  const { id } = useParams()
  return <ExperiencePage key={id} id={id} />
}

function ExperiencePage({ id }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const catalogItems = useSelector((state) => state.experiences.items) // para "También te puede gustar" y la insignia del anfitrión
  // La experiencia con TODAS sus fotos (el catálogo solo tiene la portada): { item, loading, error, notFound }
  const detail = useSelector((state) => state.experiences.details[id])
  const allSessions = useSelector((state) => state.sessions.items)
  const { items: allReviews, requested } = useSelector((state) => state.reviews)

  const experience = detail?.item ?? null
  const publisherId = experience?.publisherId
  const profile = useSelector((state) => state.users.profiles[publisherId])
  const host = profile?.item

  // Al montar: la experiencia y sus reseñas, solo si todavía no están en el store (así no se repite el GET)
  const reviewsRequested = requested.includes(experienceKey(id))
  useEffect(() => {
    if (!detail) dispatch(fetchExperienceById(id))
  }, [detail, id, dispatch])
  useEffect(() => {
    if (!reviewsRequested) dispatch(fetchReviewsByExperience(id))
  }, [reviewsRequested, id, dispatch])

  // El perfil del anfitrión (público) se pide cuando ya sabemos quién es
  useEffect(() => {
    if (publisherId && !profile) dispatch(fetchUserById(publisherId))
  }, [publisherId, profile, dispatch])

  // "Vistos recientemente" (slice persistido): se anota cuando la experiencia cargó bien
  const experienceId = experience?.id
  useEffect(() => {
    if (experienceId) dispatch(addRecentlyViewed(experienceId))
  }, [experienceId, dispatch])

  const catalog = addSessionInfo(catalogItems, allSessions)
  const reviews = allReviews.filter((review) => review.experienceId === Number(id)).sort(byNewest)

  // El panel recién existe cuando terminó de cargar
  const loading = !detail || detail.loading
  const panelRef = useRef(null)
  const panelOffscreen = useElementOffscreen(panelRef, loading)
  useDocumentTitle(experience?.title ?? 'Experiencia')

  if (loading) return <Loading text="Cargando la experiencia..." />
  // Una pausada el back solo se la devuelve a su anfitrión y a los administradores; una dada de baja, solo al admin
  if (detail.notFound) {
    return <NotFoundPage title="Esta experiencia no está disponible" text="Puede que el anfitrión la haya despublicado o dado de baja." />
  }
  if (detail.error) {
    return (
      <div className="container page page--narrow">
        <ErrorState title="No pudimos cargar la experiencia" message={detail.error} onRetry={() => dispatch(fetchExperienceById(id))} />
      </div>
    )
  }

  // Las fechas salen del store (se pidieron al abrir la app): las próximas y activas de esta experiencia
  const upcoming = getUpcomingSessions(allSessions, experience.id)
  const soldOut = upcoming.length > 0 && upcoming.every((session) => session.availableSeats === 0)
  const duration = upcoming[0] && hoursBetween(upcoming[0].startsAt, upcoming[0].endsAt)
  // Mientras llega el perfil (o si falló) armamos uno con el nombre que viene en la experiencia
  const hostInfo = host ?? { id: experience.publisherId, firstName: experience.publisherName, lastName: '' }
  const hostStats = getHostStats(catalog, experience.publisherId)

  const city = getCity(experience.location)
  const isHost = Boolean(user) && user.id === experience.publisherId
  const isDeleted = experience.status === 'DELETED'

  // El anfitrión responde una reseña (PUT): el reducer la reemplaza por la que devuelve el back
  const replyReview = (review, text) =>
    dispatch(replyToReview({ id: review.id, reply: text }))
      .then((action) => {
        // rejected: el back respondió con un error (action.error.message, como en el reducer)
        if (action.error) {
          dispatch(showToast({ message: action.error.message, tone: 'error' }))
          throw action.error // ReviewCard deja el borrador abierto
        }
        return dispatch(showToast({ message: action.payload.hostReply ? 'Respuesta publicada' : 'Respuesta borrada' }))
      })

  const share = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => dispatch(showToast({ message: 'Link copiado. ¡Compartilo con quien quieras!', tone: 'info' })))
      .catch(() => dispatch(showToast({ message: 'No pudimos copiar el link', tone: 'error' })))
  }
  // Los planes se deciden en grupo: el link listo para mandar por WhatsApp
  const whatsappText = `Mirá este plan: ${experience.title} en ${city}, desde ${formatMoney(experience.finalPrice)} por persona. ${window.location.href}`

  return (
    <div className="container page experience-page">
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', to: '/' },
          { label: city, to: `/?location=${encodeURIComponent(city)}` },
          { label: experience.categoryName, to: `/?location=${encodeURIComponent(city)}&categoryId=${experience.categoryId}` },
          { label: experience.title },
        ]}
        eyebrow={experience.categoryName}
        title={experience.title}
        actions={
          <>
            {!isDeleted && <FavoriteButton experience={experience} withLabel />}
            <a className="icon-btn icon-btn--default" href={whatsappUrl(whatsappText)} target="_blank" rel="noreferrer" aria-label="Compartir por WhatsApp" title="Compartir por WhatsApp">
              <MessageCircle size={18} aria-hidden />
            </a>
            <IconButton icon={Share2} label="Copiar link" onClick={share} />
          </>
        }
      />

      {isDeleted ? (
        <Notice tone="danger">Esta experiencia fue dada de baja: solo la ven los administradores. Sus reservas se reembolsaron.</Notice>
      ) : (
        !experience.active && (
          <Notice tone="warning">Esta experiencia está pausada: no aparece en el catálogo y solo la ven su anfitrión y los administradores.</Notice>
        )
      )}

      <ExperienceMeta experience={experience} duration={duration} />

      <Gallery images={experience.images} title={experience.title} />

      <div className="split experience__body">
        <div>
          <section>
            <h2>Qué vas a hacer</h2>
            <p className="experience__description">{experience.description}</p>
            {experience.tags.length > 0 && (
              <>
                <p className="muted small experience__tags-title">Ideal si te gusta…</p>
                <TagList tags={experience.tags} />
              </>
            )}
            {experience.favoriteCount > 0 && (
              <p className="muted small experience__saved">♥ {pluralize(experience.favoriteCount, 'persona la guardó', 'personas la guardaron')}</p>
            )}
          </section>

          <section className="section">
            <h2>Dónde nos encontramos</h2>
            <LocationMap location={experience.location} />
          </section>

          <section className="section">
            <HostCard host={hostInfo} stats={hostStats} />
          </section>

          <ReviewsSection reviews={reviews} averageRating={experience.averageRating} onReply={isHost ? replyReview : undefined} />
        </div>

        <BookingPanel key={experience.id} id="reservar" ref={panelRef} experience={experience} sessions={upcoming} />
      </div>

      <RelatedExperiences experience={experience} catalog={catalog} />
      <StickyBookingBar
        experience={experience}
        visible={panelOffscreen}
        soldOut={soldOut}
        onShowDates={() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
      />
    </div>
  )
}

export default ExperienceRoute

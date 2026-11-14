import { useEffect, useMemo, useRef } from 'react'
import { Share2 } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import BookingPanel from '../components/experience/BookingPanel'
import ExperienceMeta from '../components/experience/ExperienceMeta'
import Gallery from '../components/experience/Gallery'
import HostCard from '../components/experience/HostCard'
import LocationMap from '../components/experience/LocationMap'
import RelatedExperiences from '../components/experience/RelatedExperiences'
import ReviewsSection from '../components/experience/ReviewsSection'
import StickyBookingBar from '../components/experience/StickyBookingBar'
import ErrorState from '../components/ui/ErrorState'
import IconButton from '../components/ui/IconButton'
import Loading from '../components/ui/Loading'
import Notice from '../components/ui/Notice'
import PageHeader from '../components/ui/PageHeader'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useElementOffscreen } from '../hooks/useElementOffscreen'
import { selectUser } from '../redux/authSlice'
import { fetchExperienceById, selectCatalog } from '../redux/experiencesSlice'
import { fetchReviewsByExperience, replyToReview } from '../redux/reviewsSlice'
import { showToast } from '../redux/toastsSlice'
import { fetchUserById } from '../redux/usersSlice'
import { hoursBetween } from '../utils/dates'
import { byNewest, getUpcomingSessions } from '../utils/experiences'
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
  const user = useSelector(selectUser)
  const catalog = useSelector(selectCatalog) // para "También te puede gustar"
  // La experiencia con TODAS sus fotos (el catálogo solo tiene la portada): { item, loading, error, notFound }
  const detail = useSelector((state) => state.experiences.details[id])
  const allSessions = useSelector((state) => state.sessions.items)
  const allReviews = useSelector((state) => state.reviews.items)

  const experience = detail?.item ?? null
  const publisherId = experience?.publisherId
  const host = useSelector((state) => state.users.profiles[publisherId]?.item)

  // Al montar: la experiencia y sus reseñas. Si ya se habían pedido, están en el store y no se repite el GET
  useEffect(() => {
    dispatch(fetchExperienceById(id))
    dispatch(fetchReviewsByExperience(id))
  }, [id, dispatch])

  // El perfil del anfitrión (público) se pide cuando ya sabemos quién es
  useEffect(() => {
    if (publisherId) dispatch(fetchUserById(publisherId))
  }, [publisherId, dispatch])

  const reviews = useMemo(
    () => allReviews.filter((review) => review.experienceId === Number(id)).sort(byNewest),
    [allReviews, id],
  )

  // El panel recién existe cuando terminó de cargar
  const loading = !detail || detail.loading
  const panelRef = useRef(null)
  const panelOffscreen = useElementOffscreen(panelRef, loading)
  useDocumentTitle(experience?.title ?? 'Experiencia')

  if (loading) return <Loading text="Cargando la experiencia..." />
  // Una pausada el back solo se la devuelve a su anfitrión y a los administradores
  if (detail.notFound) {
    return <NotFoundPage title="Esta experiencia no está disponible" text="Puede que el anfitrión la haya despublicado." />
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

  const city = getCity(experience.location)
  const isHost = Boolean(user) && user.id === experience.publisherId

  // El anfitrión responde una reseña (PUT): el reducer la reemplaza por la que devuelve el back
  const replyReview = (review, text) =>
    dispatch(replyToReview({ id: review.id, reply: text }))
      .unwrap()
      .then((updated) => dispatch(showToast(updated.hostReply ? 'Respuesta publicada' : 'Respuesta borrada')))
      .catch((error) => {
        dispatch(showToast(error.message, 'error'))
        throw error // ReviewCard deja el borrador abierto
      })

  const share = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => dispatch(showToast('Link copiado. ¡Compartilo con quien quieras!', 'info')))
      .catch(() => dispatch(showToast('No pudimos copiar el link', 'error')))
  }

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
        actions={<IconButton icon={Share2} label="Copiar link" onClick={share} />}
      />

      {!experience.active && (
        <Notice tone="warning">Esta experiencia está pausada: no aparece en el catálogo y solo la ven su anfitrión y los administradores.</Notice>
      )}

      <ExperienceMeta experience={experience} duration={duration} />

      <Gallery images={experience.images} title={experience.title} />

      <div className="split experience__body">
        <div>
          <section>
            <h2>Qué vas a hacer</h2>
            <p className="experience__description">{experience.description}</p>
          </section>

          <section className="section">
            <h2>Dónde nos encontramos</h2>
            <LocationMap location={experience.location} />
          </section>

          <section className="section">
            <HostCard host={hostInfo} />
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

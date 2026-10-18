import { useEffect, useRef, useState } from 'react'
import { Share2 } from 'lucide-react'
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
import IconButton from '../components/ui/IconButton'
import Loading from '../components/ui/Loading'
import PageHeader from '../components/ui/PageHeader'
import { useAuth } from '../hooks/useAuth'
import { useCatalog } from '../hooks/useCatalog'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useElementOffscreen } from '../hooks/useElementOffscreen'
import { useToast } from '../hooks/useToast'
import { getExperience } from '../services/experiencesService'
import { getReviewsByExperience, replyToReview } from '../services/reviewsService'
import { getSessionsByExperience } from '../services/sessionsService'
import { getUser } from '../services/usersService'
import { hoursBetween } from '../utils/dates'
import { byNewest, getUpcomingSessions } from '../utils/experiences'
import { getCity } from '../utils/location'
import NotFoundPage from './NotFoundPage'
import './ExperiencePage.css'

/**
 * Al pasar de una experiencia a otra (por ejemplo, desde "También te puede gustar") cambia el id:
 * con key={id} React monta la página de nuevo y arranca con el estado limpio.
 */
function ExperienceRoute() {
  const { id } = useParams()
  return <ExperiencePage key={id} id={id} />
}

function ExperiencePage({ id }) {
  const notify = useToast()
  const { user } = useAuth()
  const catalog = useCatalog() // para "También te puede gustar"

  const [experience, setExperience] = useState(null)
  const [sessions, setSessions] = useState([])
  const [reviews, setReviews] = useState([])
  const [host, setHost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Al montar traemos la experiencia, sus fechas y sus reseñas
  useEffect(() => {
    getExperience(id)
      .then((data) => setExperience(data))
      .catch(() => setNotFound(true))
      .then(() => setLoading(false))

    getSessionsByExperience(id)
      .then((data) => setSessions(data))
      .catch((error) => console.error('Error al traer las fechas:', error))

    getReviewsByExperience(id)
      .then((data) => setReviews(data.sort(byNewest)))
      .catch((error) => console.error('Error al traer las reseñas:', error))
  }, [id])

  // El perfil del anfitrión (público) se pide cuando ya sabemos quién es
  const publisherId = experience?.publisherId
  useEffect(() => {
    if (!publisherId) return
    getUser(publisherId)
      .then((data) => setHost(data))
      .catch((error) => console.error('Error al traer el anfitrión:', error))
  }, [publisherId])

  // El panel recién existe cuando terminó de cargar
  const panelRef = useRef(null)
  const panelOffscreen = useElementOffscreen(panelRef, loading)
  useDocumentTitle(experience?.title ?? 'Experiencia')

  if (loading) return <Loading text="Cargando la experiencia..." />
  if (notFound || !experience || !experience.active) {
    return <NotFoundPage title="Esta experiencia no está disponible" text="Puede que el anfitrión la haya despublicado." />
  }

  const upcoming = getUpcomingSessions(sessions, experience.id)
  const soldOut = upcoming.length > 0 && upcoming.every((session) => session.availableSeats === 0)
  const duration = upcoming[0] && hoursBetween(upcoming[0].startsAt, upcoming[0].endsAt)
  // Mientras llega el perfil (o si falló) armamos uno con el nombre que viene en la experiencia
  const hostInfo = host ?? { id: experience.publisherId, firstName: experience.publisherName, lastName: '' }

  const city = getCity(experience.location)
  const isHost = Boolean(user) && user.id === experience.publisherId

  // El anfitrión responde una reseña: el back la guarda y devuelve la reseña actualizada
  const replyReview = (review, text) =>
    replyToReview(review.id, text)
      .then((updated) => {
        setReviews((current) => current.map((item) => (item.id === updated.id ? updated : item)))
        notify(updated.hostReply ? 'Respuesta publicada' : 'Respuesta borrada', 'success')
      })
      .catch((error) => {
        notify(error.message, 'error')
        throw error
      })

  const share = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => notify('Link copiado. ¡Compartilo con quien quieras!', 'info'))
      .catch(() => notify('No pudimos copiar el link', 'error'))
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
        actions={
          <>
            <IconButton icon={Share2} label="Copiar link" onClick={share} />
            <FavoriteButton experienceId={experience.id} variant="default" />
          </>
        }
      />

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

      <RelatedExperiences experience={experience} catalog={catalog.experiences} />
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

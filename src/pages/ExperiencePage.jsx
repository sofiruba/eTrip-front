import { Check, Clock, MapPin, Share2 } from 'lucide-react'
import { useParams } from 'react-router-dom'
import BookingPanel from '../components/experience/BookingPanel'
import FavoriteButton from '../components/experience/FavoriteButton'
import Gallery from '../components/experience/Gallery'
import HostCard from '../components/experience/HostCard'
import ReviewsSection from '../components/experience/ReviewsSection'
import Badge from '../components/ui/Badge'
import IconButton from '../components/ui/IconButton'
import PageHeader from '../components/ui/PageHeader'
import { Rating } from '../components/ui/Rating'
import { findById, getReviews, getUpcomingSessions } from '../data/selectors'
import { useStore } from '../hooks/useStore'
import { useToast } from '../hooks/useToast'
import NotFoundPage from './NotFoundPage'
import './ExperiencePage.css'

function ExperiencePage() {
  const { id } = useParams()
  const { db, experiences } = useStore()
  const notify = useToast()
  const experience = findById(experiences, id)

  if (!experience) return <NotFoundPage title="Esta experiencia no existe" text="Puede que el anfitrión la haya despublicado." />

  const sessions = getUpcomingSessions(db, experience.id)
  const reviews = getReviews(db, (review) => review.experienceId === experience.id)
  const host = findById(db.users, experience.publisherId)

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      notify('Link copiado. ¡Compartilo con quien quieras!', 'info')
    } catch {
      notify('No pudimos copiar el link', 'error')
    }
  }

  return (
    <div className="container page">
      <PageHeader
        back={{ to: '/', label: 'Volver a explorar' }}
        eyebrow={experience.categoryName}
        title={experience.title}
        description={experience.subtitle}
        actions={
          <>
            <IconButton icon={Share2} label="Copiar link" onClick={share} />
            <FavoriteButton experienceId={experience.id} variant="default" />
          </>
        }
      />

      <div className="experience__meta">
        <Rating value={experience.averageRating} count={experience.reviewCount} />
        <span className="meta">
          <MapPin size={16} aria-hidden />
          {experience.location}
        </span>
        <span className="meta">
          <Clock size={16} aria-hidden />
          {experience.durationHours} horas aprox.
        </span>
        {experience.discountPercentage > 0 && <Badge tone="brand">{experience.discountPercentage}% OFF</Badge>}
      </div>

      <Gallery images={experience.images} title={experience.title} />

      <div className="split experience__body">
        <div>
          <section>
            <h2>Qué vas a hacer</h2>
            <p className="experience__description">{experience.description}</p>
          </section>

          {experience.includes?.length > 0 && (
            <section className="section">
              <h2>Qué incluye</h2>
              <ul className="experience__includes">
                {experience.includes.map((item) => (
                  <li key={item}>
                    <Check size={18} aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="section">
            <h2>Dónde nos encontramos</h2>
            <div className="experience__map">
              <MapPin size={28} aria-hidden />
              <strong>{experience.location}</strong>
              <small className="muted">Te enviamos el punto exacto al confirmar la reserva.</small>
            </div>
          </section>

          {host && (
            <section className="section">
              <HostCard host={host} />
            </section>
          )}

          <ReviewsSection reviews={reviews} averageRating={experience.averageRating} />
        </div>

        <BookingPanel key={experience.id} experience={experience} sessions={sessions} />
      </div>
    </div>
  )
}

export default ExperiencePage

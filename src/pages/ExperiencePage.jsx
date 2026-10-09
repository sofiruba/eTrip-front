import { useEffect, useState } from 'react'
import { Baby, Check, Clock, MapPin, Share2, Users } from 'lucide-react'
import { useParams } from 'react-router-dom'
import BookingPanel from '../components/experience/BookingPanel'
import FavoriteButton from '../components/experience/FavoriteButton'
import Gallery from '../components/experience/Gallery'
import HostCard from '../components/experience/HostCard'
import ExperienceCard from '../components/experience/ExperienceCard'
import ReviewsSection from '../components/experience/ReviewsSection'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import IconButton from '../components/ui/IconButton'
import Money from '../components/ui/Money'
import PageHeader from '../components/ui/PageHeader'
import { Rating } from '../components/ui/Rating'
import SectionHeader from '../components/ui/SectionHeader'
import { findById, getReviews, getUpcomingSessions, isSoldOut } from '../data/selectors'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useStore } from '../hooks/useStore'
import { describeMinAge } from '../utils/guests'
import { getArea, getCity } from '../utils/location'
import { useToast } from '../hooks/useToast'
import NotFoundPage from './NotFoundPage'
import './ExperiencePage.css'

const MAX_RELATED = 3

/** Misma categoría primero; si no alcanza, se completa con otras que tengan fechas. */
function getRelated(experiences, experience) {
  const others = experiences.filter((entry) => entry.id !== experience.id && entry.active !== false && entry.nextSession)
  const sameCategory = others.filter((entry) => entry.categoryId === experience.categoryId)
  const rest = others.filter((entry) => entry.categoryId !== experience.categoryId)
  return [...sameCategory, ...rest].slice(0, MAX_RELATED)
}

/**
 * true cuando el elemento queda fuera de pantalla (para mostrar la barra fija en mobile).
 * `watchKey` vuelve a engancharse si el elemento se remonta (al pasar a otra experiencia).
 */
function useElementOffscreen(id, watchKey) {
  const [offscreen, setOffscreen] = useState(false)
  useEffect(() => {
    const element = document.getElementById(id)
    if (!element || !('IntersectionObserver' in window)) return undefined
    const observer = new IntersectionObserver(([entry]) => setOffscreen(!entry.isIntersecting))
    observer.observe(element)
    return () => observer.disconnect()
  }, [id, watchKey])
  return offscreen
}

function ExperiencePage() {
  const { id } = useParams()
  const { db, experiences } = useStore()
  const notify = useToast()
  const [mapFailed, setMapFailed] = useState(false)
  const experience = findById(experiences, id)
  const panelOffscreen = useElementOffscreen('reservar', experience?.id)
  useDocumentTitle(experience?.title ?? 'Experiencia no encontrada')

  if (!experience || experience.active === false) {
    return <NotFoundPage title="Esta experiencia no está disponible" text="Puede que el anfitrión la haya despublicado." />
  }

  const sessions = getUpcomingSessions(db, experience.id)
  const reviews = getReviews(db, (review) => review.experienceId === experience.id)
  const host = findById(db.users, experience.publisherId)
  const related = getRelated(experiences, experience)
  const soldOut = isSoldOut(experience)
  const area = getArea(experience.location)
  const city = getCity(experience.location)
  const mapLabel = [area, city].filter(Boolean).join(', ') || experience.location
  // Google ubica el marcador en el punto de referencia del barrio, sin exponer una dirección.
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(mapLabel)}&z=14&output=embed`

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      notify('Link copiado. ¡Compartilo con quien quieras!', 'info')
    } catch {
      notify('No pudimos copiar el link', 'error')
    }
  }

  return (
    <div className="container page experience-page">
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', to: '/' },
          { label: getCity(experience.location), to: `/?location=${encodeURIComponent(getCity(experience.location))}` },
          { label: experience.categoryName, to: `/?location=${encodeURIComponent(getCity(experience.location))}&categoryId=${experience.categoryId}` },
          { label: experience.title },
        ]}
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
        <span className="meta">
          {experience.minAge ? <Users size={16} aria-hidden /> : <Baby size={16} aria-hidden />}
          {describeMinAge(experience.minAge)}
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
              {mapLabel ? (
                <iframe
                  title={`Mapa de ${mapLabel}`}
                  src={mapUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  onError={() => setMapFailed(true)}
                  hidden={mapFailed}
                />
              ) : null}
              {(!mapLabel || mapFailed) && (
                <div className="experience__map-fallback">
                  <MapPin size={24} aria-hidden />
                  <strong>Ubicación aproximada no disponible</strong>
                  <small className="muted">Te enviamos el punto exacto al confirmar la reserva.</small>
                </div>
              )}
              <div className="experience__map-label">
                <MapPin size={18} aria-hidden />
                <strong>{mapLabel}</strong>
              </div>
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

        <BookingPanel key={experience.id} id="reservar" experience={experience} sessions={sessions} />
      </div>

      {related.length > 0 && (
        <section className="section">
          <SectionHeader eyebrow="Seguí explorando" title="También te puede gustar" />
          <div className="experience-grid">
            {related.map((entry) => (
              <ExperienceCard key={entry.id} experience={entry} />
            ))}
          </div>
        </section>
      )}

      <div className={`experience__sticky-cta ${panelOffscreen ? 'is-visible' : ''}`} aria-hidden={!panelOffscreen}>
        <p>
          <strong>
            <Money value={experience.finalPrice} original={experience.price} />
          </strong>
          <span className="muted small"> / persona</span>
        </p>
        <Button
          tabIndex={panelOffscreen ? 0 : -1}
          disabled={soldOut}
          onClick={() => document.getElementById('reservar')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
        >
          {soldOut ? 'Agotado' : 'Ver fechas'}
        </Button>
      </div>
    </div>
  )
}

export default ExperiencePage

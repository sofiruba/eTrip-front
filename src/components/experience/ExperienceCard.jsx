import { CalendarDays } from 'lucide-react'
import { Link } from 'react-router-dom'
import { isSoldOut, LOW_SEATS } from '../../data/selectors'
import { formatShortDate } from '../../utils/format'
import { ADULT_AGE } from '../../utils/guests'
import Badge from '../ui/Badge'
import ImageWithFallback from '../ui/ImageWithFallback'
import Money from '../ui/Money'
import { Rating } from '../ui/Rating'
import FavoriteButton from './FavoriteButton'
import './ExperienceCard.css'

/**
 * Tarjeta de experiencia. `to` permite cambiar el destino (por ejemplo, en el editor
 * se usa sin link para la vista previa) y `footer` agrega acciones debajo.
 */
function ExperienceCard({ experience, to = `/experiencias/${experience.id}`, footer, showFavorite = true }) {
  const { title, subtitle, images, location, publisherName, finalPrice, price, discountPercentage, nextSession } = experience
  const Wrapper = to ? Link : 'div'
  const soldOut = isSoldOut(experience)
  const seatsLeft = nextSession?.availableSeats ?? 0

  return (
    <article className={`experience-card ${soldOut ? 'is-sold-out' : ''}`}>
      <Wrapper {...(to ? { to } : {})} className="experience-card__link">
        <div className="experience-card__media">
          <ImageWithFallback src={images[0]} alt={title} />
          {discountPercentage > 0 && (
            <div className="experience-card__discount">
              <Badge tone="brand">-{discountPercentage}%</Badge>
            </div>
          )}
          <div className="experience-card__badges">
            {soldOut ? (
              <Badge tone="danger">Agotado</Badge>
            ) : (
              <Badge tone={nextSession ? 'neutral' : 'warning'}>
                <CalendarDays size={12} aria-hidden />
                {nextSession ? formatShortDate(nextSession.startsAt) : 'Sin fechas'}
              </Badge>
            )}
            {nextSession && seatsLeft <= LOW_SEATS && <Badge tone="warning">¡Quedan {seatsLeft}!</Badge>}
            {experience.minAge >= ADULT_AGE && <Badge tone="neutral">+18</Badge>}
          </div>
        </div>
        <div className="experience-card__body">
          <div className="experience-card__title">
            <h3>{title || 'El título de tu experiencia'}</h3>
            <Rating value={experience.averageRating} count={experience.reviewCount} />
          </div>
          <p className="experience-card__subtitle">{subtitle}</p>
          <p className="muted small">
            {publisherName} · {location}
          </p>
          <p className="experience-card__price">
            <strong>
              <Money value={finalPrice} original={price} />
            </strong>
            <span className="muted"> / persona</span>
          </p>
        </div>
      </Wrapper>
      {showFavorite && <FavoriteButton experienceId={experience.id} className="experience-card__favorite" />}
      {footer && <div className="experience-card__footer">{footer}</div>}
    </article>
  )
}

export default ExperienceCard

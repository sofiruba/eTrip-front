import { formatRelativeDate } from '../../utils/format'
import Avatar from '../ui/Avatar'
import { StarRating } from '../ui/Rating'
import './ReviewCard.css'

/** Reseña. Con showExperience muestra la experiencia (en el perfil) en vez del autor. */
function ReviewCard({ review, showExperience = false, actions }) {
  return (
    <article className="review-card">
      <header className="review-card__header">
        {!showExperience && <Avatar name={review.userName} size="sm" />}
        <div className="review-card__author">
          <strong>{showExperience ? review.experienceTitle : review.userName}</strong>
          <small className="muted">{formatRelativeDate(review.createdAt)}</small>
        </div>
        <StarRating value={review.rating} size={14} />
      </header>
      <p>“{review.comment}”</p>
      {actions && <div className="review-card__actions">{actions}</div>}
    </article>
  )
}

export default ReviewCard

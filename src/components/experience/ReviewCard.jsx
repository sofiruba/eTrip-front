import { useState } from 'react'
import { MessageCircleReply } from 'lucide-react'
import { formatRelativeDate } from '../../utils/format'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import { StarRating } from '../ui/Rating'
import './ReviewCard.css'

const CLAMP_CHARS = 180

/**
 * Reseña. Con showExperience muestra la experiencia (en el perfil) en vez del autor.
 * - onExpand: si viene y el texto es largo, se recorta y aparece "Mostrar más" (abre el detalle).
 * - onReply(texto): si viene, el anfitrión puede responder / editar su respuesta (devuelve una promesa).
 */
function ReviewCard({ review, showExperience = false, actions, onExpand, onReply }) {
  const [replying, setReplying] = useState(false)
  const [draft, setDraft] = useState(review.hostReply ?? '')
  const [saving, setSaving] = useState(false)
  const comment = review.comment ?? ''
  const clamped = Boolean(onExpand) && comment.length > CLAMP_CHARS

  const saveReply = (event) => {
    event.preventDefault()
    setSaving(true)
    onReply(draft)
      .then(() => setReplying(false))
      .catch(() => {})
      .then(() => setSaving(false))
  }

  return (
    <article className="review-card" id={`review-${review.id}`}>
      <header className="review-card__header">
        {!showExperience && <Avatar name={review.userName} src={review.userAvatarUrl} size="sm" />}
        <div className="review-card__author">
          <strong>{showExperience ? review.experienceTitle : review.userName}</strong>
          <small className="muted">{formatRelativeDate(review.createdAt)}</small>
        </div>
        <StarRating value={review.rating} size={14} />
      </header>

      {comment && <p className={clamped ? 'review-card__text is-clamped' : 'review-card__text'}>{comment}</p>}
      {clamped && (
        <button type="button" className="review-card__more" onClick={onExpand}>
          Mostrar más
        </button>
      )}

      {review.hostReply && !replying && (
        <div className="review-card__reply">
          <strong>
            <MessageCircleReply size={14} aria-hidden /> Respuesta de {review.hostName ?? 'el anfitrión'}
          </strong>
          <small className="muted">{formatRelativeDate(review.hostReplyAt)}</small>
          <p className={clamped ? 'is-clamped' : ''}>{review.hostReply}</p>
        </div>
      )}

      {onReply && !replying && (
        <button type="button" className="review-card__more" onClick={() => setReplying(true)}>
          {review.hostReply ? 'Editar respuesta' : 'Responder'}
        </button>
      )}

      {replying && (
        <form className="review-card__reply-form" onSubmit={saveReply}>
          <textarea
            aria-label="Tu respuesta"
            value={draft}
            maxLength={1000}
            rows={3}
            autoFocus
            placeholder="Agradecé o contá algo más. La respuesta es pública."
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="review-card__actions">
            <Button type="submit" size="sm" disabled={saving}>
              {draft.trim() ? 'Publicar respuesta' : 'Borrar respuesta'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setReplying(false)
                setDraft(review.hostReply ?? '')
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {actions && <div className="review-card__actions">{actions}</div>}
    </article>
  )
}

export default ReviewCard

import { useState } from 'react'
import { useToast } from '../../hooks/useToast'
import { createReview } from '../../services/reviewsService'
import Button from '../ui/Button'
import FormField from '../ui/FormField'
import Modal from '../ui/Modal'
import { StarRating } from '../ui/Rating'

const MIN_LENGTH = 10
const RATING_LABELS = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', '¡Excelente!']

/** Escribir una reseña (POST /reviews). Le pasa al padre la reseña creada (onCreated). */
function ReviewFormModal({ experienceId, experienceTitle, onCreated, onClose }) {
  const notify = useToast()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!rating) return setError('Elegí una calificación de 1 a 5 estrellas.')
    if (comment.trim().length < MIN_LENGTH) return setError(`Escribí al menos ${MIN_LENGTH} caracteres.`)

    setSending(true)
    return createReview({ experienceId, rating, comment: comment.trim() })
      .then((review) => {
        onCreated(review)
        notify('¡Gracias! Tu reseña ya está publicada')
        onClose()
      })
      .catch((reviewError) => {
        setError(reviewError.message)
        setSending(false)
      })
  }

  return (
    <Modal
      title="¿Cómo estuvo tu plan?"
      description={experienceTitle}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="review-form" disabled={sending}>
            Publicar reseña
          </Button>
        </>
      }
    >
      <form id="review-form" className="stack" onSubmit={handleSubmit}>
        <div className="rating-picker">
          <StarRating
            value={rating}
            size={30}
            onChange={(value) => {
              setRating(value)
              setError('')
            }}
          />
          <small className="muted">{RATING_LABELS[rating] || 'Elegí una calificación'}</small>
        </div>
        <FormField
          as="textarea"
          label="Contá tu experiencia"
          rows={5}
          value={comment}
          placeholder="¿Qué fue lo que más te gustó?"
          onChange={(event) => {
            setComment(event.target.value)
            setError('')
          }}
        />
        {error && <p className="form-error">{error}</p>}
        <p className="muted small">Una vez publicada no se puede editar, pero sí eliminar desde tu perfil.</p>
      </form>
    </Modal>
  )
}

export default ReviewFormModal

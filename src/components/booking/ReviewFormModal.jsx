import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useStore } from '../../hooks/useStore'
import { useToast } from '../../hooks/useToast'
import { toLocalIso } from '../../data/dates'
import Button from '../ui/Button'
import FormField from '../ui/FormField'
import Modal from '../ui/Modal'
import { StarRating } from '../ui/Rating'

const MIN_LENGTH = 10
const RATING_LABELS = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', '¡Excelente!']

/** Crear o editar una reseña. Si recibe `review`, la edita. */
function ReviewFormModal({ experienceId, experienceTitle, review, onClose }) {
  const { user } = useAuth()
  const { create, update } = useStore()
  const notify = useToast()
  const [rating, setRating] = useState(review?.rating ?? 0)
  const [comment, setComment] = useState(review?.comment ?? '')
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!rating) return setError('Elegí una calificación de 1 a 5 estrellas.')
    if (comment.trim().length < MIN_LENGTH) return setError(`Escribí al menos ${MIN_LENGTH} caracteres.`)

    const data = { rating, comment: comment.trim() }
    if (review) update('reviews', review.id, data)
    else create('reviews', { ...data, experienceId, userId: user.id, createdAt: toLocalIso(new Date()) })

    notify(review ? 'Reseña actualizada' : '¡Gracias! Tu reseña ya está publicada')
    return onClose()
  }

  return (
    <Modal
      title={review ? 'Editar reseña' : '¿Cómo estuvo tu plan?'}
      description={experienceTitle}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="review-form">
            {review ? 'Guardar cambios' : 'Publicar reseña'}
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
      </form>
    </Modal>
  )
}

export default ReviewFormModal

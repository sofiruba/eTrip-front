import { useState } from 'react'
import { experiences } from '../data/mockData'
import ImageWithFallback from '../components/ImageWithFallback'

function ReviewFormScreen({ onBack, onSaved }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  const submit = (event) => {
    event.preventDefault()
    if (!rating) {
      setError('Elegí una calificación de 1 a 5 estrellas.')
      return
    }
    if (comment.trim().length < 10) {
      setError('Escribí al menos 10 caracteres sobre tu experiencia.')
      return
    }
    onSaved({ name: 'Sofía R.', date: 'Ahora', rating, text: comment.trim() })
  }

  return (
    <main className="inner-page narrow">
      <button className="back-button" onClick={onBack}>← Volver a mis reseñas</button>
      <div className="page-title">
        <span className="intro-tag">COMPARTÍ TU EXPERIENCIA</span>
        <h1>¿Cómo estuvo<br /><em>tu plan?</em></h1>
        <p>Tu opinión ayuda a otras personas a elegir y a los anfitriones a seguir mejorando.</p>
      </div>
      <form className="review-form-card" onSubmit={submit}>
        <div className="review-experience-preview">
          <ImageWithFallback src={experiences[0].image} alt={experiences[0].title} />
          <div><span className="category-label">EXPERIENCIA RESERVADA</span><h2>{experiences[0].title}</h2><small>La Boca · Sábado 26 de octubre</small></div>
        </div>
        <fieldset>
          <legend>Tu calificación</legend>
          <div className="rating-picker" aria-label="Elegir calificación">
            {[1, 2, 3, 4, 5].map((value) => <button type="button" className={value <= rating ? 'selected' : ''} key={value} onClick={() => { setRating(value); setError('') }} aria-label={`${value} estrellas`}>★</button>)}
          </div>
          <small className="rating-label">{rating ? `${rating} de 5 estrellas` : 'Elegí una calificación'}</small>
        </fieldset>
        <label>Contá tu experiencia<textarea value={comment} onChange={(event) => { setComment(event.target.value); setError('') }} placeholder="¿Qué fue lo que más te gustó?" rows="5" /></label>
        {error && <p className="auth-error">{error}</p>}
        <div className="form-actions"><button type="button" className="outline-button" onClick={onBack}>Cancelar</button><button className="primary-button" type="submit">Publicar reseña →</button></div>
      </form>
    </main>
  )
}

export default ReviewFormScreen

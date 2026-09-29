import { useEffect } from 'react'

function ReviewModal({ reviews, rating, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const allReviews = [...reviews, ...reviews, ...reviews]
  return <div className="reviews-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="reviews-modal" role="dialog" aria-modal="true" aria-labelledby="reviews-modal-title"><div className="reviews-modal-header"><div><p className="eyebrow">RESEÑAS</p><h2 id="reviews-modal-title">★ {rating} · {reviews.length + 18} calificaciones</h2></div><button className="reviews-modal-close" aria-label="Cerrar reseñas" onClick={onClose}>×</button></div><div className="reviews-modal-list">{allReviews.map((review, index) => <article className="review-item" key={`${review.name}-${index}`}><div className="review-top"><span className="avatar">{review.name.slice(0, 2).toUpperCase()}</span><span><strong>{review.name}</strong><small>{review.date}</small></span><b>{'★'.repeat(review.rating)}</b></div><p>“{review.text}”</p></article>)}</div></section></div>
}

export default ReviewModal

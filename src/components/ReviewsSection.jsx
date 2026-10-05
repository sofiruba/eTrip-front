import { useState } from 'react'
import ReviewModal from './ReviewModal'

function ReviewCard({ review }) {
  return <article className="review-item"><div className="review-top"><span className="avatar">{review.name.slice(0, 2).toUpperCase()}</span><span><strong>{review.name}</strong><small>{review.date}</small></span><b>{'★'.repeat(review.rating)}</b></div><p>“{review.text}”</p></article>
}

function ReviewsSection({ reviews, rating }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return <>
    <section className="reviews-section"><div className="section-heading"><div><p className="eyebrow">RESEÑAS</p><h2>Lo que dicen los huéspedes</h2></div><strong className="review-score">★ {rating} · {reviews.length + 18}</strong></div><div className="reviews-grid">{reviews.map((review) => <ReviewCard review={review} key={review.name} />)}</div><button className="show-more-button" onClick={() => setIsModalOpen(true)}>Mostrar todas las calificaciones</button></section>
    {isModalOpen && <ReviewModal reviews={reviews} rating={rating} onClose={() => setIsModalOpen(false)} />}
  </>
}

export default ReviewsSection

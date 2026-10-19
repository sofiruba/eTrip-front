import './RatingBreakdown.css'

/** Cuántas reseñas hay de cada puntaje, de 5 a 1 estrellas. */
const distribution = (reviews) =>
  [5, 4, 3, 2, 1].map((stars) => ({ stars, count: reviews.filter((review) => review.rating === stars).length }))

/** Barras con la distribución de puntajes (5★ … 1★). Se usa en la sección de reseñas y en su modal. */
function RatingBreakdown({ reviews, className = '' }) {
  return (
    <ul className={`rating-breakdown ${className}`} aria-label="Distribución de puntajes">
      {distribution(reviews).map(({ stars, count }) => (
        <li key={stars}>
          <span>{stars}★</span>
          <span className="rating-breakdown__bar" aria-hidden>
            <span style={{ width: `${reviews.length ? (count / reviews.length) * 100 : 0}%` }} />
          </span>
          <span className="muted">{count}</span>
        </li>
      ))}
    </ul>
  )
}

export default RatingBreakdown

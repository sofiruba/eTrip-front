import { useEffect, useState } from 'react'
import { MessageSquare, Search, Star } from 'lucide-react'
import { normalizeText } from '../../utils/format'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'
import Modal from '../ui/Modal'
import { Rating } from '../ui/Rating'
import SectionHeader from '../ui/SectionHeader'
import ReviewCard from './ReviewCard'

const PREVIEW_COUNT = 4

const SORTS = {
  recent: { label: 'Más recientes', compare: (a, b) => new Date(b.createdAt) - new Date(a.createdAt) },
  best: { label: 'Mejor puntuación', compare: (a, b) => b.rating - a.rating },
  worst: { label: 'Peor puntuación', compare: (a, b) => a.rating - b.rating },
}

/** Cuántas reseñas hay de cada puntaje, de 5 a 1 estrellas. */
const distribution = (reviews) =>
  [5, 4, 3, 2, 1].map((stars) => ({ stars, count: reviews.filter((review) => review.rating === stars).length }))

/**
 * Reseñas de una experiencia, al estilo Airbnb: grilla con las primeras y un modal con todas
 * (resumen con barras por puntaje a la izquierda, lista con búsqueda y orden a la derecha).
 * onReply(review, texto): si viene (lo ve el anfitrión), cada reseña se puede responder.
 */
function ReviewsSection({ reviews, averageRating, onReply }) {
  const [openAt, setOpenAt] = useState(null) // null = cerrado; 'all' o el id de la reseña a mostrar
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('recent')

  // Al abrir desde "Mostrar más" bajamos hasta esa reseña dentro del modal
  useEffect(() => {
    if (openAt === null || openAt === 'all') return
    requestAnimationFrame(() => document.getElementById(`review-${openAt}`)?.scrollIntoView({ block: 'center' }))
  }, [openAt])

  const average = Number(averageRating) || 0
  const filtered = reviews
    .filter((review) => !query.trim() || normalizeText(review.comment ?? '').includes(normalizeText(query.trim())))
    .toSorted(SORTS[sort].compare)
  const replyProps = (review) => (onReply ? { onReply: (text) => onReply(review, text) } : {})

  return (
    <section className="section">
      <SectionHeader eyebrow="Reseñas" title="Lo que dicen quienes fueron">
        <Rating value={average} count={reviews.length} />
      </SectionHeader>

      {reviews.length ? (
        <div className="review-grid">
          {reviews.slice(0, PREVIEW_COUNT).map((review) => (
            <ReviewCard key={review.id} review={review} onExpand={() => setOpenAt(review.id)} {...replyProps(review)} />
          ))}
        </div>
      ) : (
        <EmptyState icon={MessageSquare} title="Todavía no hay reseñas" text="¡Sé la primera persona en contar cómo estuvo!" />
      )}

      {reviews.length > 0 && (
        <Button variant="secondary" className="section-more" onClick={() => setOpenAt('all')}>
          {reviews.length > PREVIEW_COUNT ? `Mostrar las ${reviews.length} reseñas` : 'Ver detalle de las reseñas'}
        </Button>
      )}

      {openAt !== null && (
        <Modal title={`${reviews.length} reseñas`} size="xl" onClose={() => setOpenAt(null)}>
          <div className="reviews-modal">
            <aside className="reviews-modal__summary">
              <p className="reviews-modal__average">
                <Star size={28} aria-hidden />
                <strong>{average.toFixed(1)}</strong>
              </p>
              <p className="muted small">Promedio de {reviews.length} reseñas</p>
              <ul className="reviews-modal__bars" aria-label="Distribución de puntajes">
                {distribution(reviews).map(({ stars, count }) => (
                  <li key={stars}>
                    <span>{stars}</span>
                    <span className="reviews-modal__bar" aria-hidden>
                      <span style={{ width: `${reviews.length ? (count / reviews.length) * 100 : 0}%` }} />
                    </span>
                    <span className="muted">{count}</span>
                  </li>
                ))}
              </ul>
            </aside>

            <div className="reviews-modal__list">
              <div className="reviews-modal__tools">
                <label className="reviews-modal__search">
                  <Search size={16} aria-hidden />
                  <input
                    type="search"
                    aria-label="Buscar en las reseñas"
                    placeholder="Buscar en las reseñas"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>
                <select aria-label="Ordenar reseñas" value={sort} onChange={(event) => setSort(event.target.value)}>
                  {Object.entries(SORTS).map(([id, { label }]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {filtered.length ? (
                filtered.map((review) => <ReviewCard key={review.id} review={review} {...replyProps(review)} />)
              ) : (
                <p className="muted">Ninguna reseña menciona “{query}”.</p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </section>
  )
}

export default ReviewsSection

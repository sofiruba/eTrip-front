import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'
import Modal from '../ui/Modal'
import { Rating } from '../ui/Rating'
import SectionHeader from '../ui/SectionHeader'
import ReviewCard from './ReviewCard'

const PREVIEW_COUNT = 4

function ReviewsSection({ reviews, averageRating }) {
  const [showAll, setShowAll] = useState(false)

  return (
    <section className="section">
      <SectionHeader eyebrow="Reseñas" title="Lo que dicen quienes fueron">
        <Rating value={averageRating} count={reviews.length} />
      </SectionHeader>

      {reviews.length ? (
        <div className="review-grid">
          {reviews.slice(0, PREVIEW_COUNT).map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <EmptyState icon={MessageSquare} title="Todavía no hay reseñas" text="¡Sé la primera persona en contar cómo estuvo!" />
      )}

      {reviews.length > PREVIEW_COUNT && (
        <Button variant="secondary" className="section-more" onClick={() => setShowAll(true)}>
          Ver las {reviews.length} reseñas
        </Button>
      )}

      {showAll && (
        <Modal title={`${reviews.length} reseñas`} size="lg" onClose={() => setShowAll(false)}>
          <div className="stack">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </Modal>
      )}
    </section>
  )
}

export default ReviewsSection

import { MessageSquare, Trash2 } from 'lucide-react'
import ReviewCard from '../experience/ReviewCard'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'
import SectionHeader from '../ui/SectionHeader'

/** Reseñas que escribió el usuario. Al tocar "Eliminar" avisa cuál (onDelete). */
function MyReviewsSection({ reviews, onDelete }) {
  return (
    <section className="section">
      <SectionHeader eyebrow="Tu voz" title="Mis reseñas" />
      {reviews.length ? (
        <div className="review-grid">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              showExperience
              actions={
                <Button size="sm" variant="ghost" icon={Trash2} onClick={() => onDelete(review)}>
                  Eliminar
                </Button>
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={MessageSquare}
          title="Todavía no escribiste reseñas"
          text="Después de vivir una experiencia, vas a poder contar cómo fue desde Mis reservas."
        />
      )}
    </section>
  )
}

export default MyReviewsSection

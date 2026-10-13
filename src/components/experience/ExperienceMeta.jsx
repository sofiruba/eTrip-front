import { Clock, MapPin } from 'lucide-react'
import Badge from '../ui/Badge'
import { Rating } from '../ui/Rating'
import './ExperienceMeta.css'

/** Fila de datos bajo el título: puntaje, lugar, duración y descuento. */
function ExperienceMeta({ experience, duration }) {
  return (
    <div className="experience-meta">
      <Rating value={experience.averageRating} count={experience.reviewCount} />
      <span className="meta">
        <MapPin size={16} aria-hidden />
        {experience.location}
      </span>
      {duration > 0 && (
        <span className="meta">
          <Clock size={16} aria-hidden />
          {duration} {duration === 1 ? 'hora' : 'horas'}
        </span>
      )}
      {experience.discountPercentage > 0 && <Badge tone="brand">{experience.discountPercentage}% OFF</Badge>}
    </div>
  )
}

export default ExperienceMeta

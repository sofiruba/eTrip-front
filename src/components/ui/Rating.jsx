import { Star } from 'lucide-react'
import './Rating.css'

/** Puntaje compacto: ★ 4.9 (12) */
export function Rating({ value, count }) {
  if (!count) return <span className="rating rating--new">Nuevo</span>
  return (
    <span className="rating">
      <Star size={14} aria-hidden />
      <strong>{value.toFixed(1)}</strong>
      {count !== undefined && <span className="muted">({count})</span>}
    </span>
  )
}

/** Cinco estrellas. Si recibe onChange se puede elegir el puntaje. */
export function StarRating({ value, onChange, size = 18 }) {
  const editable = Boolean(onChange)
  return (
    <div className={`stars ${editable ? 'stars--editable' : ''}`} role={editable ? 'radiogroup' : 'img'} aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const icon = <Star size={size} className={star <= value ? 'is-filled' : ''} aria-hidden />
        return editable ? (
          <button
            type="button"
            key={star}
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} estrellas`}
            onClick={() => onChange(star)}
          >
            {icon}
          </button>
        ) : (
          <span key={star}>{icon}</span>
        )
      })}
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getCancellationPolicy } from '../../utils/cancellation'
import { formatMoney, formatTimeRange, formatWeekdayDate, pluralize } from '../../utils/format'
import ImageWithFallback from '../ui/ImageWithFallback'
import QuantityStepper from '../ui/QuantityStepper'
import { Rating } from '../ui/Rating'

/** Una línea del carrito en el resumen del checkout: fecha, participantes, política y precio. */
function CheckoutItem({ line, collapsible, onQuantityChange }) {
  const { experience, session, quantity, subtotal } = line
  const [editingGuests, setEditingGuests] = useState(false)
  const policy = getCancellationPolicy(session.startsAt)

  const details = (
    <dl className="checkout-item__details">
      <div className="checkout-item__block">
        <dt>{policy.title}</dt>
        <dd>{policy.text}</dd>
      </div>
      <div className="checkout-item__block">
        <dt>Fecha</dt>
        <dd>
          <span className="checkout-item__capitalize">{formatWeekdayDate(session.startsAt)}</span>
          <br />
          {formatTimeRange(session.startsAt, session.endsAt)}
        </dd>
      </div>
      <div className="checkout-item__block checkout-item__block--action">
        <div>
          <dt>Participantes</dt>
          <dd>
            {pluralize(quantity, 'persona')}
            <small className="muted"> · quedan {session.availableSeats} lugares</small>
          </dd>
        </div>
        <button type="button" className="checkout-pill" onClick={() => setEditingGuests((open) => !open)} aria-expanded={editingGuests}>
          {editingGuests ? 'Listo' : 'Cambiar'}
        </button>
        {editingGuests && (
          <div className="checkout-item__stepper">
            <span className="small">Personas</span>
            <QuantityStepper value={quantity} max={session.availableSeats} label="Participantes" onChange={onQuantityChange} />
          </div>
        )}
      </div>
      <div className="checkout-item__block">
        <dt>Detalles del precio</dt>
        <dd className="checkout-item__price">
          <span>
            {formatMoney(experience.finalPrice)} × {pluralize(quantity, 'persona')}
            {experience.discountPercentage > 0 && <small className="checkout-item__off"> −{experience.discountPercentage}% off</small>}
          </span>
          <strong>{formatMoney(subtotal)}</strong>
        </dd>
      </div>
    </dl>
  )

  const header = (
    <div className="checkout-item__header">
      <ImageWithFallback src={experience.images[0]} alt="" className="checkout-item__image" />
      <div>
        <Link to={`/experiencias/${experience.id}`} className="checkout-item__title">
          {experience.title}
        </Link>
        <Rating value={experience.averageRating} count={experience.reviewCount} />
      </div>
    </div>
  )

  if (!collapsible) {
    return (
      <article className="checkout-item">
        {header}
        {details}
      </article>
    )
  }

  return (
    <details className="checkout-item checkout-item--collapsible">
      <summary>
        {header}
        <span className="checkout-item__summary-total">{formatMoney(subtotal)}</span>
      </summary>
      {details}
    </details>
  )
}

export default CheckoutItem

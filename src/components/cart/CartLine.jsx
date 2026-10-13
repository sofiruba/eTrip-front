import { Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getCartProblem } from '../../utils/cart'
import { formatMoney, formatSessionDate, isPast } from '../../utils/format'
import Button from '../ui/Button'
import IconButton from '../ui/IconButton'
import ImageWithFallback from '../ui/ImageWithFallback'
import Notice from '../ui/Notice'
import QuantityStepper from '../ui/QuantityStepper'
import './CartLine.css'

/** Una fecha del carrito. Avisa los cambios de cantidad (onQuantityChange) y si se quita (onRemove). */
function CartLine({ line, onQuantityChange, onRemove }) {
  const { quantity, session, experience, subtotal } = line
  const problem = getCartProblem(line)
  const canAdjust = quantity > session.availableSeats && session.availableSeats > 0

  return (
    <li className={`cart-line ${problem ? 'has-problem' : ''}`}>
      <ImageWithFallback src={experience.images[0]} alt="" className="cart-line__image" />
      <div className="cart-line__info">
        <span className="eyebrow">{experience.categoryName}</span>
        <Link to={`/experiencias/${experience.id}`}>
          <h3>{experience.title}</h3>
        </Link>
        <p className="muted small">
          {formatSessionDate(session.startsAt)} · {experience.location}
        </p>
        {session.availableSeats > 0 && !isPast(session.startsAt) && (
          <QuantityStepper value={Math.min(quantity, session.availableSeats)} max={session.availableSeats} onChange={onQuantityChange} />
        )}
        {problem && (
          <Notice
            tone="danger"
            action={
              canAdjust ? (
                <Button size="sm" variant="secondary" onClick={() => onQuantityChange(session.availableSeats)}>
                  Ajustar
                </Button>
              ) : (
                <Button size="sm" variant="secondary" onClick={onRemove}>
                  Quitar
                </Button>
              )
            }
          >
            {problem}
          </Notice>
        )}
      </div>
      <div className="cart-line__aside">
        <strong>{formatMoney(subtotal)}</strong>
        <IconButton icon={Trash2} label="Quitar del carrito" variant="ghost" onClick={onRemove} />
      </div>
    </li>
  )
}

export default CartLine

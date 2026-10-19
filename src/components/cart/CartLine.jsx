import { Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getCartProblem } from '../../utils/cart'
import { formatMoney, formatSessionDate, isPast } from '../../utils/format'
import Button from '../ui/Button'
import Approx from '../ui/Approx'
import IconButton from '../ui/IconButton'
import ImageWithFallback from '../ui/ImageWithFallback'
import Notice from '../ui/Notice'
import QuantityStepper from '../ui/QuantityStepper'
import './CartLine.css'

/** Una fecha del carrito. Avisa los cambios de cantidad (onQuantityChange) y si se quita (onRemove). */
function CartLine({ line, onQuantityChange, onRemove }) {
  const { quantity, session, experience, subtotal } = line
  const problem = getCartProblem(line)
  // Si la fecha ya no está (session = null) solo se puede quitar; si la experiencia se pausó, tampoco hay foto ni link
  const canAdjust = Boolean(session) && quantity > session.availableSeats && session.availableSeats > 0
  const canChange = Boolean(session) && session.availableSeats > 0 && !isPast(session.startsAt)
  const title = experience?.title ?? line.experienceTitle

  return (
    <li className={`cart-line ${problem ? 'has-problem' : ''}`}>
      <ImageWithFallback src={experience?.images[0]} alt="" className="cart-line__image" />
      <div className="cart-line__info">
        {experience && <span className="eyebrow">{experience.categoryName}</span>}
        {experience ? (
          <Link to={`/experiencias/${experience.id}`}>
            <h3>{title}</h3>
          </Link>
        ) : (
          <h3>{title}</h3>
        )}
        <p className="muted small">
          {formatSessionDate(line.startsAt)}
          {experience && ` · ${experience.location}`}
        </p>
        {canChange && (
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
        <span className="cart-line__amount">
          <strong>{formatMoney(subtotal)}</strong>
          <Approx value={subtotal} />
        </span>
        <IconButton icon={Trash2} label="Quitar del carrito" variant="ghost" onClick={onRemove} />
      </div>
    </li>
  )
}

export default CartLine

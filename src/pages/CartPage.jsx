import { ArrowRight, ShoppingBag, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import OrderSummary from '../components/booking/OrderSummary'
import { toSummaryItems } from '../components/booking/toSummaryItems'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import IconButton from '../components/ui/IconButton'
import ImageWithFallback from '../components/ui/ImageWithFallback'
import PageHeader from '../components/ui/PageHeader'
import QuantityStepper from '../components/ui/QuantityStepper'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'
import { formatMoney, formatSessionDate } from '../utils/format'
import './CartPage.css'

function CartPage() {
  const { lines, updateQuantity, remove } = useCart()
  const { user, openAuth } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="container page">
      <PageHeader
        back={{ to: '/', label: 'Seguir explorando' }}
        eyebrow="Carrito"
        title="Tus próximas"
        accent="experiencias."
        description="Revisá las fechas y la cantidad de personas antes de confirmar."
      />

      {!lines.length ? (
        <EmptyState icon={ShoppingBag} title="Tu carrito está vacío" text="Encontrá un plan y reservá tu lugar.">
          <Button to="/">Explorar experiencias</Button>
        </EmptyState>
      ) : (
        <div className="split">
          <ul className="cart-list">
            {lines.map(({ sessionId, quantity, session, experience, subtotal }) => (
              <li key={sessionId} className="cart-line">
                <ImageWithFallback src={experience.images[0]} alt="" className="cart-line__image" />
                <div className="cart-line__info">
                  <span className="eyebrow">{experience.categoryName}</span>
                  <Link to={`/experiencias/${experience.id}`}>
                    <h3>{experience.title}</h3>
                  </Link>
                  <p className="muted small">
                    {formatSessionDate(session.startsAt)} · {experience.location}
                  </p>
                  <QuantityStepper
                    value={quantity}
                    max={session.availableSeats}
                    onChange={(value) => updateQuantity(sessionId, value)}
                  />
                </div>
                <div className="cart-line__aside">
                  <strong>{formatMoney(subtotal)}</strong>
                  <IconButton icon={Trash2} label="Quitar del carrito" variant="ghost" onClick={() => remove(sessionId)} />
                </div>
              </li>
            ))}
          </ul>

          <OrderSummary title="Resumen" items={toSummaryItems(lines)}>
            <Button full iconRight={ArrowRight} onClick={() => (user ? navigate('/checkout') : openAuth('login'))}>
              Continuar al pago
            </Button>
            {!user && <p className="muted small">Te vamos a pedir que inicies sesión.</p>}
          </OrderSummary>
        </div>
      )}
    </div>
  )
}

export default CartPage

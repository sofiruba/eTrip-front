import { ArrowRight, ShoppingBag, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import OrderSummary from '../components/booking/OrderSummary'
import { toSummaryItems } from '../components/booking/toSummaryItems'
import CheckoutSteps from '../components/checkout/CheckoutSteps'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import IconButton from '../components/ui/IconButton'
import Notice from '../components/ui/Notice'
import ImageWithFallback from '../components/ui/ImageWithFallback'
import PageHeader from '../components/ui/PageHeader'
import QuantityStepper from '../components/ui/QuantityStepper'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { formatMoney, formatSessionDate, isPast, pluralize } from '../utils/format'
import './CartPage.css'

function CartPage() {
  const { lines, updateQuantity, remove, missingCount, savings } = useCart()
  const { user, openAuth } = useAuth()
  const navigate = useNavigate()
  useDocumentTitle('Carrito')

  // Problemas que impedirían pagar: avisarlos acá y no recién en el checkout
  const problemOf = ({ session, quantity }) => {
    if (isPast(session.startsAt)) return 'Esta fecha ya pasó.'
    if (session.availableSeats === 0) return 'Se agotaron los lugares de esta fecha.'
    if (quantity > session.availableSeats) return `Solo quedan ${pluralize(session.availableSeats, 'lugar', 'lugares')}.`
    return null
  }
  const hasProblems = lines.some((line) => problemOf(line))

  return (
    <div className="container page">
      {lines.length > 0 && <CheckoutSteps current={0} />}
      <PageHeader
        back={{ to: '/', label: 'Seguir explorando' }}
        eyebrow="Carrito"
        title="Tus próximas"
        accent="experiencias."
        description="Revisá las fechas y la cantidad de personas antes de confirmar."
      />

      {missingCount > 0 && (
        <div className="cart-notice">
          <Notice tone="warning">
            {missingCount === 1
              ? 'Quitamos 1 fecha de tu carrito porque el anfitrión la dio de baja.'
              : `Quitamos ${missingCount} fechas de tu carrito porque el anfitrión las dio de baja.`}
          </Notice>
        </div>
      )}

      {!lines.length ? (
        <EmptyState icon={ShoppingBag} title="Tu carrito está vacío" text="Encontrá un plan y reservá tu lugar.">
          <Button to="/">Explorar experiencias</Button>
        </EmptyState>
      ) : (
        <div className="split">
          <ul className="cart-list">
            {lines.map((line) => {
              const { sessionId, quantity, session, experience, subtotal } = line
              const problem = problemOf(line)
              return (
                <li key={sessionId} className={`cart-line ${problem ? 'has-problem' : ''}`}>
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
                      <QuantityStepper
                        value={Math.min(quantity, session.availableSeats)}
                        max={session.availableSeats}
                        onChange={(value) => updateQuantity(sessionId, value)}
                      />
                    )}
                    {problem && (
                      <Notice
                        tone="danger"
                        action={
                          quantity > session.availableSeats && session.availableSeats > 0 ? (
                            <Button size="sm" variant="secondary" onClick={() => updateQuantity(sessionId, session.availableSeats)}>
                              Ajustar
                            </Button>
                          ) : (
                            <Button size="sm" variant="secondary" onClick={() => remove(sessionId)}>
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
                    <IconButton icon={Trash2} label="Quitar del carrito" variant="ghost" onClick={() => remove(sessionId)} />
                  </div>
                </li>
              )
            })}
          </ul>

          <OrderSummary title="Resumen" items={toSummaryItems(lines)}>
            {savings > 0 && <p className="cart-savings">Ahorrás {formatMoney(savings)} con las ofertas</p>}
            <Button
              full
              iconRight={ArrowRight}
              disabled={hasProblems}
              onClick={() => (user ? navigate('/checkout') : openAuth('login', '/checkout'))}
            >
              Continuar al pago
            </Button>
            {hasProblems && <p className="muted small">Resolvé los avisos del carrito para continuar.</p>}
            {!user && !hasProblems && <p className="muted small">Te vamos a pedir que inicies sesión.</p>}
          </OrderSummary>
        </div>
      )}
    </div>
  )
}

export default CartPage

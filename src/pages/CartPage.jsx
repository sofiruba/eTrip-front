import { ArrowRight, ShoppingBag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import OrderSummary from '../components/booking/OrderSummary'
import CartLine from '../components/cart/CartLine'
import CheckoutSteps from '../components/checkout/CheckoutSteps'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Loading from '../components/ui/Loading'
import Notice from '../components/ui/Notice'
import PageHeader from '../components/ui/PageHeader'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'
import { useCatalog } from '../hooks/useCatalog'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useToast } from '../hooks/useToast'
import { buildCartLines, getCartProblem } from '../utils/cart'
import { formatMoney } from '../utils/format'
import { toSummaryItems } from '../utils/orders'
import './CartPage.css'

function CartPage() {
  const cart = useCart()
  const { experiences, sessions, loading } = useCatalog()
  const { user, openAuth } = useAuth()
  const notify = useToast()
  const navigate = useNavigate()
  useDocumentTitle('Carrito')

  // Cada ítem del carrito con su experiencia (foto, lugar) y su sesión (lugares que quedan)
  const lines = buildCartLines(cart.items, experiences, sessions)
  const missingCount = loading ? 0 : cart.items.length - lines.length
  const savings = lines.reduce((sum, line) => sum + (line.experience.price - line.experience.finalPrice) * line.quantity, 0)

  // Si el back rechaza el cambio, mostramos su mensaje
  const updateQuantity = (line, quantity) => cart.updateQuantity(line.id, quantity).catch((error) => notify(error.message, 'error'))
  const remove = (line) => cart.remove(line.id).catch((error) => notify(error.message, 'error'))

  // Problemas que impedirían pagar: se avisan acá y no recién en el checkout
  const hasProblems = lines.some((line) => getCartProblem(line))

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

      {loading && cart.items.length > 0 ? (
        <Loading />
      ) : !lines.length ? (
        <EmptyState icon={ShoppingBag} title="Tu carrito está vacío" text="Encontrá un plan y reservá tu lugar.">
          <Button to="/">Explorar experiencias</Button>
        </EmptyState>
      ) : (
        <div className="split">
          <ul className="cart-list">
            {lines.map((line) => (
              <CartLine
                key={line.sessionId}
                line={line}
                onQuantityChange={(value) => updateQuantity(line, value)}
                onRemove={() => remove(line)}
              />
            ))}
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

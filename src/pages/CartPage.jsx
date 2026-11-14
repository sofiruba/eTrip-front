import { ArrowRight, ShoppingBag } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import OrderSummary from '../components/booking/OrderSummary'
import CartLine from '../components/cart/CartLine'
import CheckoutSteps from '../components/checkout/CheckoutSteps'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Loading from '../components/ui/Loading'
import PageHeader from '../components/ui/PageHeader'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { openAuth, selectUser } from '../redux/authSlice'
import { removeCartItem, updateCartItem } from '../redux/cartSlice'
import { selectCatalogStatus } from '../redux/experiencesSlice'
import { showToast } from '../redux/toastsSlice'
import { buildCartLines, getCartProblem } from '../utils/cart'
import { formatMoney } from '../utils/format'
import { toSummaryItems } from '../utils/orders'
import './CartPage.css'

function CartPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  // El carrito, las experiencias y las fechas ya están en el store: la página solo se suscribe
  const cart = useSelector((state) => state.cart)
  const experiences = useSelector((state) => state.experiences.items)
  const sessions = useSelector((state) => state.sessions.items)
  const { loading: catalogLoading } = useSelector(selectCatalogStatus)
  const user = useSelector(selectUser)
  useDocumentTitle('Carrito')

  // Cada ítem del carrito con su experiencia (foto, lugar) y su sesión (lugares que quedan)
  const lines = buildCartLines(cart.items, experiences, sessions)
  const savings = lines.reduce(
    (sum, line) => sum + (line.experience ? (line.experience.price - line.experience.finalPrice) * line.quantity : 0),
    0,
  )

  // PATCH y DELETE: el reducer actualiza el carrito con lo que responde el back. Si lo rechaza, mostramos su mensaje
  const updateQuantity = (line, quantity) =>
    dispatch(updateCartItem({ itemId: line.id, quantity }))
      .unwrap()
      .catch((error) => dispatch(showToast(error.message, 'error')))
  const remove = (line) =>
    dispatch(removeCartItem(line.id))
      .unwrap()
      .catch((error) => dispatch(showToast(error.message, 'error')))

  // Problemas que impedirían pagar: se avisan acá y no recién en el checkout
  const hasProblems = lines.some((line) => getCartProblem(line))
  // Con sesión, esperamos a que llegue el carrito; y para revisar los lugares, a que estén las fechas
  const waiting = (Boolean(user) && !cart.loaded && !cart.error) || (catalogLoading && cart.items.length > 0)

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

      {waiting ? (
        <Loading text="Revisando los lugares disponibles..." />
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
              onClick={() => (user ? navigate('/checkout') : dispatch(openAuth('login', '/checkout')))}
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

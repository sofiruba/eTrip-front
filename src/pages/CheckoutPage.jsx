import { useRef, useState } from 'react'
import { CalendarX, Lock, ShieldCheck, ShoppingBag } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import CheckoutSteps from '../components/checkout/CheckoutSteps'
import CheckoutSummary from '../components/checkout/CheckoutSummary'
import PaymentMethods from '../components/checkout/PaymentMethods'
import { EMPTY_CARD, WALLETS } from '../components/checkout/paymentOptions'
import PaymentProcessing from '../components/checkout/PaymentProcessing'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Loading from '../components/ui/Loading'
import PageHeader from '../components/ui/PageHeader'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'
import { useCatalog } from '../hooks/useCatalog'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useFreshSessions } from '../hooks/useFreshSessions'
import { useSavedCards } from '../hooks/useSavedCards'
import { useToast } from '../hooks/useToast'
import { validateCoupon } from '../services/couponsService'
import { createOrder } from '../services/ordersService'
import { buildCartLines, getCartProblem } from '../utils/cart'
import {
  CARD_BRANDS,
  DECLINED_TEST_CARD,
  cardLabel,
  detectBrand,
  isCardExpired,
  onlyDigits,
  toSavedCard,
  validateCard,
} from '../utils/cards'
import { formatMoney, fullName } from '../utils/format'
import { calculateDiscount } from '../utils/orders'
import './CheckoutPage.css'

function CheckoutPage() {
  const { user } = useAuth()
  const cart = useCart()
  const { experiences, sessions, loading, refreshSessions } = useCatalog()
  const sessionsReady = useFreshSessions() // lugares que quedan ahora, no los de cuando se abrió la app
  const savedCards = useSavedCards()
  const notify = useToast()
  const navigate = useNavigate()
  useDocumentTitle('Pago')

  const [method, setMethod] = useState(() => {
    const usable = savedCards.cards.find((saved) => !isCardExpired(saved))
    return usable ? `saved:${usable.id}` : 'card'
  })
  const [card, setCard] = useState(() => ({ ...EMPTY_CARD, holder: fullName(user) }))
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [coupon, setCoupon] = useState(null) // resultado de validateCoupon
  const [error, setError] = useState('')
  const [payment, setPayment] = useState(null) // { provider, label, approved } mientras se procesa
  const completingOrder = useRef(false)
  const formRef = useRef(null)
  const lines = buildCartLines(cart.items, experiences, sessions)

  if ((loading || !sessionsReady) && cart.items.length && !payment) return <Loading text="Revisando los lugares disponibles..." />

  if (!lines.length && !payment) {
    return (
      <div className="container page page--narrow">
        <EmptyState icon={ShoppingBag} title="No hay nada para pagar" text="Agregá una experiencia al carrito para continuar.">
          <Button to="/">Explorar experiencias</Button>
        </EmptyState>
      </div>
    )
  }

  // Una fecha que ya no existe no se puede pagar ni mostrar acá: se quita desde el carrito
  if (lines.some((line) => line.unavailable) && !payment) {
    return (
      <div className="container page page--narrow">
        <EmptyState
          icon={CalendarX}
          title="Hay fechas que ya no están disponibles"
          text="Pasaron, el anfitrión las canceló o pausó la experiencia. Quitalas del carrito para seguir."
        >
          <Button to="/carrito">Volver al carrito</Button>
        </EmptyState>
      </div>
    )
  }

  const discount = coupon?.valid ? calculateDiscount(cart.total, coupon) : 0
  const total = cart.total - discount
  const cardErrors = method === 'card' ? validateCard(card) : {}
  const visibleCardErrors = Object.fromEntries(
    Object.entries(cardErrors).filter(([field]) => submitted || touched[field]),
  )

  const describePayment = () => {
    if (method === 'card') {
      const brand = detectBrand(card.number)
      return {
        provider: `el banco emisor de tu ${CARD_BRANDS[brand].name}`,
        label: cardLabel({ brand, last4: onlyDigits(card.number).slice(-4) }),
        approved: onlyDigits(card.number) !== DECLINED_TEST_CARD,
      }
    }
    if (method.startsWith('saved:')) {
      const saved = savedCards.cards.find((entry) => `saved:${entry.id}` === method)
      return { provider: `el banco emisor de tu ${CARD_BRANDS[saved.brand].name}`, label: cardLabel(saved), approved: true }
    }
    const wallet = WALLETS.find((entry) => entry.id === method)
    return { provider: wallet.name, label: wallet.name, approved: true }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')
    // Chequeo rápido con los lugares que ya trajimos; la validación real la hace el back al crear la orden
    const problemLine = lines.find((line) => getCartProblem(line))
    if (problemLine) return setError(`“${problemLine.experience.title}”: ${getCartProblem(problemLine)} Ajustá la cantidad.`)

    if (Object.keys(cardErrors).length) {
      setSubmitted(true)
      // Llevamos el foco al primer campo con error, buscándolo solo dentro de este formulario (ref)
      return requestAnimationFrame(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus())
    }
    return setPayment(describePayment())
  }

  // POST /orders: el back compra todo lo que hay en el carrito, descuenta los cupos y vacía el carrito.
  // Devuelve una promesa con { ok, order } o { ok: false, message }: PaymentProcessing decide qué mostrar.
  const confirmOrder = () => {
    if (completingOrder.current) return Promise.resolve({ ok: false, message: 'La compra ya se está confirmando.' })
    completingOrder.current = true

    return createOrder(coupon?.valid ? coupon.code : null)
      .then((order) => {
        if (method === 'card' && card.save) savedCards.saveCard(toSavedCard(card))
        return { ok: true, order }
      })
      .catch((orderError) => ({ ok: false, message: orderError.message }))
      .then((result) => {
        completingOrder.current = false
        return result
      })
  }

  // El carrito quedó vacío y los cupos cambiaron: actualizamos los dos y vamos a la confirmación
  const finishOrder = (order) => {
    cart.reload()
    refreshSessions()
    navigate(`/checkout/confirmacion/${order.id}`, { replace: true, state: { paymentLabel: payment.label } })
  }

  // El back rechazó la compra: mostramos su motivo y traemos de nuevo carrito y lugares para que se vea qué cambió
  const handleOrderFailed = (message) => {
    setPayment(null)
    setError(message)
    cart.reload()
    refreshSessions()
  }

  const applyCoupon = (code) => {
    validateCoupon(code)
      .then((data) => setCoupon(data))
      .catch((couponError) => notify(couponError.message, 'error'))
  }

  const changeQuantity = (line, quantity) =>
    cart.updateQuantity(line.id, quantity).catch((quantityError) => notify(quantityError.message, 'error'))

  return (
    <div className="container page">
      <CheckoutSteps current={1} />
      <PageHeader back={{ to: '/carrito', label: 'Volver al carrito' }} title="Confirmá y" accent="pagá." />

      <div className="checkout">
        <form className="checkout__main" onSubmit={handleSubmit} noValidate ref={formRef}>
          <section className="checkout__panel">
            <h2>Método de pago</h2>
            <PaymentMethods
              method={method}
              onMethodChange={(value) => {
                setMethod(value)
                setSubmitted(false)
              }}
              savedCards={savedCards.cards}
              card={card}
              cardErrors={visibleCardErrors}
              onCardChange={(patch) => setCard((current) => ({ ...current, ...patch }))}
              onCardBlur={(field) => setTouched((current) => ({ ...current, [field]: true }))}
            />
          </section>

          <p className="checkout__buyer">
            Pagás como <strong>{fullName(user)}</strong> · {user.email}. Tus vouchers van a quedar en Mis reservas.
          </p>

          <p className="checkout__legal">
            Al seleccionar el botón, aceptás los <Link to="/terminos">términos y condiciones</Link> y la{' '}
            <Link to="/ayuda#cancelaciones">política de cancelación</Link>. Consultá la{' '}
            <Link to="/privacidad">política de privacidad</Link> de PLAN.
          </p>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="checkout__pay" disabled={Boolean(payment)}>
            <Lock size={18} aria-hidden />
            Confirmá y pagá {formatMoney(total)}
          </button>

          <p className="checkout__secure">
            <ShieldCheck size={16} aria-hidden />
            Pago simulado: no se hace ningún cobro real. Nunca guardamos el número completo ni el CVV.
          </p>
        </form>

        <CheckoutSummary
          lines={lines}
          subtotal={cart.total}
          discount={discount}
          coupon={coupon}
          onApplyCoupon={applyCoupon}
          onRemoveCoupon={() => setCoupon(null)}
          onQuantityChange={changeQuantity}
        />
      </div>

      {payment && (
        <PaymentProcessing
          provider={payment.provider}
          amount={total}
          approved={payment.approved}
          onConfirm={confirmOrder}
          onDone={finishOrder}
          onFailed={handleOrderFailed}
          onDeclined={() => {
            setPayment(null)
            setError('El banco rechazó la tarjeta. Probá con otra tarjeta o con otro medio de pago.')
          }}
        />
      )}
    </div>
  )
}

export default CheckoutPage

import { useRef, useState } from 'react'
import { Lock, ShieldCheck, ShoppingBag } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import CheckoutSteps from '../components/checkout/CheckoutSteps'
import CheckoutSummary from '../components/checkout/CheckoutSummary'
import PaymentMethods from '../components/checkout/PaymentMethods'
import { EMPTY_CARD, WALLETS } from '../components/checkout/paymentOptions'
import PaymentProcessing from '../components/checkout/PaymentProcessing'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import PageHeader from '../components/ui/PageHeader'
import { apiFetch } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useSavedCards } from '../hooks/useSavedCards'
import { useStore } from '../hooks/useStore'
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
  const { placeOrder } = useStore()
  const { user } = useAuth()
  const cart = useCart()
  const savedCards = useSavedCards()
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

  if (!cart.lines.length && !payment) {
    return (
      <div className="container page page--narrow">
        <EmptyState icon={ShoppingBag} title="No hay nada para pagar" text="Agregá una experiencia al carrito para continuar.">
          <Button to="/">Explorar experiencias</Button>
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

  const findSoldOut = () => cart.lines.find((line) => line.quantity > line.session.availableSeats)

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
    const soldOut = findSoldOut()
    if (soldOut) return setError(`No quedan suficientes lugares para “${soldOut.experience.title}”. Ajustá la cantidad.`)

    if (Object.keys(cardErrors).length) {
      setSubmitted(true)
      // Llevamos el foco al primer campo con error (después de que se pinte).
      return requestAnimationFrame(() => document.querySelector('.card-form [aria-invalid="true"]')?.focus())
    }
    return setPayment(describePayment())
  }

  const completeOrder = async () => {
    if (completingOrder.current) return
    completingOrder.current = true
    const soldOut = findSoldOut()
    if (soldOut) {
      completingOrder.current = false
      const message = `Mientras pagabas se agotaron lugares para “${soldOut.experience.title}”. No se te cobró nada.`
      setError(message)
      console.error('[eTrip checkout]', { reason: 'sold_out', message })
      return { ok: false, message }
    }
    try {
      const { order, bookings } = await placeOrder({
        buyer: user,
        items: cart.lines.map(({ sessionId, quantity }) => ({ sessionId, quantity })),
        coupon: coupon?.valid ? coupon : null,
      })
      if (method === 'card' && card.save) savedCards.saveCard(toSavedCard(card))
      await cart.clear()
      navigate(`/checkout/confirmacion/${order.id}`, {
        replace: true,
        state: { paymentLabel: payment.label, total: order.total, bookingCount: bookings.length },
      })
    } catch (orderError) {
      const message = orderError.message || 'No pudimos confirmar la reserva. Revisá el carrito e intentá nuevamente.'
      setError(message)
      console.error('[eTrip checkout] Pago aprobado pero orden rechazada', {
        message,
        cartLines: cart.lines.map(({ sessionId, quantity }) => ({ sessionId, quantity })),
      })
      return { ok: false, message }
    } finally {
      completingOrder.current = false
    }
  }

  return (
    <div className="container page">
      <CheckoutSteps current={1} />
      <PageHeader back={{ to: '/carrito', label: 'Volver al carrito' }} title="Confirmá y" accent="pagá." />

      <div className="checkout">
        <form className="checkout__main" onSubmit={handleSubmit} noValidate>
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
            Pagás como <strong>{fullName(user)}</strong> · {user.email}. Te enviamos los vouchers a ese email.
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
            Pago protegido con cifrado de extremo a extremo. Nunca guardamos el número completo ni el CVV.
          </p>
        </form>

        <CheckoutSummary
          lines={cart.lines}
          subtotal={cart.total}
          discount={discount}
          coupon={coupon}
          onApplyCoupon={async (code) => {
            try {
              setCoupon(await apiFetch(`/discount-coupons/validate?code=${encodeURIComponent(code)}`))
            } catch (couponError) {
              setError(couponError.message)
            }
          }}
          onRemoveCoupon={() => setCoupon(null)}
          onQuantityChange={cart.updateQuantity}
        />
      </div>

      {payment && (
        <PaymentProcessing
          provider={payment.provider}
          amount={total}
          approved={payment.approved}
          onApproved={completeOrder}
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

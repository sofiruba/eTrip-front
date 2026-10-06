import { useState } from 'react'
import { Lock, ShieldCheck, ShoppingBag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import CheckoutSummary from '../components/checkout/CheckoutSummary'
import PaymentMethods from '../components/checkout/PaymentMethods'
import { EMPTY_CARD, WALLETS } from '../components/checkout/paymentOptions'
import PaymentProcessing from '../components/checkout/PaymentProcessing'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import PageHeader from '../components/ui/PageHeader'
import { validateCoupon } from '../data/selectors'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'
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
  const { db, placeOrder } = useStore()
  const { user } = useAuth()
  const cart = useCart()
  const savedCards = useSavedCards()
  const navigate = useNavigate()

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

  const completeOrder = () => {
    const soldOut = findSoldOut()
    if (soldOut) {
      setPayment(null)
      return setError(`Mientras pagabas se agotaron lugares para “${soldOut.experience.title}”. No se te cobró nada.`)
    }
    const { order, bookings } = placeOrder({
      buyer: user,
      items: cart.lines.map(({ sessionId, quantity }) => ({ sessionId, quantity })),
      coupon: coupon?.valid ? db.coupons.find((entry) => entry.code === coupon.code) : null,
    })
    if (method === 'card' && card.save) savedCards.saveCard(toSavedCard(card))
    cart.clear()
    return navigate(`/checkout/confirmacion/${order.id}`, {
      replace: true,
      state: { paymentLabel: payment.label, total: order.total, bookingCount: bookings.length },
    })
  }

  return (
    <div className="container page">
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
            Al seleccionar el botón, aceptás los términos de la reserva y la política de cancelación de cada experiencia. Consultá
            la política de privacidad de PLAN.
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
          onApplyCoupon={(code) => setCoupon(validateCoupon(db.coupons, code))}
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

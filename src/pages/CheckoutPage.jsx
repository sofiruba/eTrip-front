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
import Loading from '../components/ui/Loading'
import PageHeader from '../components/ui/PageHeader'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'
import { useCatalog } from '../hooks/useCatalog'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useSavedCards } from '../hooks/useSavedCards'
import { useToast } from '../hooks/useToast'
import { validateCoupon } from '../services/couponsService'
import { createOrder } from '../services/ordersService'
import { buildCartLines } from '../utils/cart'
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
  const { experiences, sessions, loading } = useCatalog()
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
  const lines = buildCartLines(cart.items, experiences, sessions)

  if (loading && cart.items.length) return <Loading />

  if (!lines.length && !payment) {
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

  const findSoldOut = () => lines.find((line) => line.quantity > line.session.availableSeats)

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

  // POST /orders: el back compra todo lo que hay en el carrito y lo vacía.
  // Devuelve una promesa: PaymentProcessing muestra el error si sale { ok: false }.
  const completeOrder = () => {
    if (completingOrder.current) return Promise.resolve()
    completingOrder.current = true

    return createOrder(coupon?.valid ? coupon.code : null)
      .then((order) => {
        if (method === 'card' && card.save) savedCards.saveCard(toSavedCard(card))
        cart.reload() // el carrito ahora está vacío en el back
        navigate(`/checkout/confirmacion/${order.id}`, { replace: true, state: { paymentLabel: payment.label } })
      })
      .catch((orderError) => {
        setError(orderError.message)
        return { ok: false, message: orderError.message }
      })
      .then((result) => {
        completingOrder.current = false
        return result
      })
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

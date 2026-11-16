import { useRef, useState } from 'react'
import { CalendarX, Lock, ShieldCheck, ShoppingBag } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import CheckoutSteps from '../components/checkout/CheckoutSteps'
import CheckoutSummary from '../components/checkout/CheckoutSummary'
import GiftFields from '../components/checkout/GiftFields'
import PaymentMethods from '../components/checkout/PaymentMethods'
import { EMPTY_CARD, WALLETS } from '../components/checkout/paymentOptions'
import PaymentProcessing from '../components/checkout/PaymentProcessing'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Loading from '../components/ui/Loading'
import PageHeader from '../components/ui/PageHeader'
import { useCurrency } from '../hooks/useCurrency'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { fetchCart, updateCartItem } from '../redux/cartSlice'
import { validateCoupon } from '../redux/couponsSlice'
import { createOrder } from '../redux/ordersSlice'
import { saveCard } from '../redux/savedCardsSlice'
import { fetchSessions } from '../redux/sessionsSlice'
import { showToast } from '../redux/toastsSlice'
import { buildCartLines, getCartProblem } from '../utils/cart'
import {
  CARD_BRANDS,
  cardLabel,
  detectBrand,
  isCardExpired,
  onlyDigits,
  toSavedCard,
  validateCard,
} from '../utils/cards'
import { formatMoney, fullName } from '../utils/format'
import './CheckoutPage.css'

function CheckoutPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const cart = useSelector((state) => state.cart)
  const experiences = useSelector((state) => state.experiences.items)
  const sessions = useSelector((state) => state.sessions.items)
  // Mientras no llegaron las experiencias y las fechas del catálogo
  const catalogLoading = useSelector((state) => !state.experiences.loaded || !state.sessions.loaded)
  const savedCards = useSelector((state) => state.savedCards.byUser[state.auth.user?.id]) ?? []
  const { approx } = useCurrency()
  useDocumentTitle('Pago')

  const [method, setMethod] = useState(() => {
    const usable = savedCards.find((saved) => !isCardExpired(saved))
    return usable ? `saved:${usable.id}` : 'card'
  })
  const [card, setCard] = useState(() => ({ ...EMPTY_CARD, holder: fullName(user) }))
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [coupon, setCoupon] = useState(null) // resultado de validateCoupon (trae los montos que calcula el back)
  // "Es un regalo": va en la orden; si el email es de una cuenta de PLAN, esa persona recibe el voucher en sus reservas
  const [gift, setGift] = useState({ enabled: false, recipientName: '', recipientEmail: '', message: '' })
  const [giftErrors, setGiftErrors] = useState({})
  const [error, setError] = useState('')
  const [payment, setPayment] = useState(null) // { provider, label } mientras se procesa
  const completingOrder = useRef(false)
  const formRef = useRef(null)
  const lines = buildCartLines(cart.items, experiences, sessions)

  // Esperamos el carrito (si se recargó la página) y las fechas, para revisar los lugares que quedan
  const waiting = (!cart.loaded && !cart.error) || (catalogLoading && cart.items.length > 0)
  if (waiting && !payment) return <Loading text="Revisando los lugares disponibles..." />

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

  const discount = coupon?.valid ? Number(coupon.discountAmount) : 0
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
      }
    }
    if (method.startsWith('saved:')) {
      const saved = savedCards.find((entry) => `saved:${entry.id}` === method)
      return { provider: `el banco emisor de tu ${CARD_BRANDS[saved.brand].name}`, label: cardLabel(saved) }
    }
    const wallet = WALLETS.find((entry) => entry.id === method)
    return { provider: wallet.name, label: wallet.name }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')
    // Chequeo rápido con los lugares que ya trajimos; la validación real la hace el back al crear la orden
    const problemLine = lines.find((line) => getCartProblem(line))
    if (problemLine) return setError(`“${problemLine.experience.title}”: ${getCartProblem(problemLine)} Ajustá la cantidad.`)

    if (gift.enabled) {
      const nextGiftErrors = {}
      if (!gift.recipientName.trim()) nextGiftErrors.recipientName = 'Contanos para quién es el regalo.'
      if (gift.recipientEmail.trim() && !/^\S+@\S+\.\S+$/.test(gift.recipientEmail.trim())) nextGiftErrors.recipientEmail = 'Ingresá un email válido.'
      if (gift.recipientEmail.trim().toLowerCase() === user.email.toLowerCase()) nextGiftErrors.recipientEmail = 'Ese es tu propio email.'
      setGiftErrors(nextGiftErrors)
      if (Object.keys(nextGiftErrors).length) return undefined
    }

    if (Object.keys(cardErrors).length) {
      setSubmitted(true)
      // Llevamos el foco al primer campo con error, buscándolo solo dentro de este formulario (ref)
      return requestAnimationFrame(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus())
    }
    return setPayment(describePayment())
  }

  // POST /orders: el back simula el pago (rechaza la tarjeta de prueba), compra todo lo que hay en el carrito,
  // descuenta los cupos y vacía el carrito. Los reducers hacen lo mismo en el store con la orden que devuelve
  // (carrito vacío, lugares descontados, orden y reservas nuevas): no hace falta volver a pedir nada.
  // Devuelve una promesa con { ok, order } o { ok: false, message }: PaymentProcessing decide qué mostrar.
  const confirmOrder = () => {
    if (completingOrder.current) return Promise.resolve({ ok: false, message: 'La compra ya se está confirmando.' })
    completingOrder.current = true

    const newOrder = {
      couponCode: coupon?.valid ? coupon.code : null,
      paymentMethod: method.startsWith('saved:') ? 'saved' : method,
      cardNumber: method === 'card' ? onlyDigits(card.number) : null,
      // El total que se le mostró: si un precio cambió mientras pagaba, el back rechaza en vez de cobrar otro monto
      expectedTotal: Math.round(total * 100) / 100,
      gift: gift.enabled
        ? { recipientName: gift.recipientName.trim(), recipientEmail: gift.recipientEmail.trim() || null, message: gift.message.trim() || null }
        : null,
    }
    return dispatch(createOrder(newOrder))
      .then((action) => {
        // rejected: el back respondió con un error (action.error.message, como en el reducer)
        if (action.error) {
          return { ok: false, message: action.error.message }
        }
        if (method === 'card' && card.save) dispatch(saveCard({ userId: user.id, card: toSavedCard(card) }))
        return { ok: true, order: action.payload }
      })
      .then((result) => {
        completingOrder.current = false
        return result
      })
  }

  // El carrito y los cupos ya se actualizaron en el store (reducers de createOrder): vamos a la confirmación
  const finishOrder = (order) => {
    navigate(`/checkout/confirmacion/${order.id}`, { replace: true, state: { paymentLabel: payment.label } })
  }

  // El back rechazó la compra (por ejemplo, alguien se llevó los últimos lugares): mostramos su motivo y, como lo que
  // tenemos en el store quedó viejo, volvemos a pedir carrito y fechas para que se vea qué cambió
  const handleOrderFailed = (message) => {
    setPayment(null)
    setError(message)
    dispatch(fetchCart(user.id))
    dispatch(fetchSessions())
    // Si cambió algún precio, el descuento del cupón también: lo recalcula el back con el carrito nuevo
    if (coupon?.valid) applyCoupon(coupon.code)
  }

  // El cupón aplicado es estado local de esta página; la validación (GET) la hace el back con el carrito actual
  const applyCoupon = (code) => {
    dispatch(validateCoupon(code))
      .then((action) => {
        // rejected: el back respondió con un error (action.error.message, como en el reducer)
        if (action.error) {
          return dispatch(showToast({ message: action.error.message, tone: 'error' }))
        }
        return setCoupon(action.payload)
      })
  }

  // Si cambia el carrito, el back vuelve a calcular el descuento del cupón
  const changeQuantity = (line, quantity) =>
    dispatch(updateCartItem({ userId: user.id, itemId: line.id, quantity }))
      .then((action) => {
        // rejected: el back respondió con un error (action.error.message, como en el reducer)
        if (action.error) {
          return dispatch(showToast({ message: action.error.message, tone: 'error' }))
        }
        return coupon?.valid && applyCoupon(coupon.code)
      })

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
              savedCards={savedCards}
              card={card}
              cardErrors={visibleCardErrors}
              onCardChange={(patch) => setCard((current) => ({ ...current, ...patch }))}
              onCardBlur={(field) => setTouched((current) => ({ ...current, [field]: true }))}
            />
          </section>

          <GiftFields
            gift={gift}
            errors={giftErrors}
            onChange={(next) => {
              setGift(next)
              setGiftErrors({})
            }}
          />

          <p className="checkout__buyer">
            Pagás como <strong>{fullName(user)}</strong> · {user.email}.{' '}
            {gift.enabled ? 'El voucher queda en tus reservas y, si tiene cuenta, también en las de quien lo recibe.' : 'Tus vouchers van a quedar en Mis reservas.'}
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
          {/* Si eligió otra moneda, dejamos claro que se cobra en pesos */}
          {approx(total) && <p className="checkout__currency muted small">Se cobra en pesos argentinos · {approx(total)}</p>}

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
          onConfirm={confirmOrder}
          onDone={finishOrder}
          onFailed={handleOrderFailed}
        />
      )}
    </div>
  )
}

export default CheckoutPage

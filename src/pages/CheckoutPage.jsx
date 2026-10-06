import { useState } from 'react'
import { CircleCheck, Lock, ShoppingBag } from 'lucide-react'
import OrderSummary from '../components/booking/OrderSummary'
import { toSummaryItems } from '../components/booking/toSummaryItems'
import VoucherCard from '../components/booking/VoucherCard'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import FormField from '../components/ui/FormField'
import PageHeader from '../components/ui/PageHeader'
import { validateCoupon } from '../data/selectors'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'
import { useStore } from '../hooks/useStore'
import { fullName } from '../utils/format'
import { calculateDiscount } from '../utils/orders'
import './CheckoutPage.css'

function CheckoutPage() {
  const { db, placeOrder } = useStore()
  const { user } = useAuth()
  const cart = useCart()
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState(null) // resultado de validateCoupon
  const [error, setError] = useState('')
  const [placedBookings, setPlacedBookings] = useState(null)

  if (placedBookings) return <CheckoutSuccess bookings={placedBookings} />

  if (!cart.lines.length) {
    return (
      <div className="container page page--narrow">
        <EmptyState icon={ShoppingBag} title="No hay nada para pagar" text="Agregá una experiencia al carrito para continuar.">
          <Button to="/">Explorar experiencias</Button>
        </EmptyState>
      </div>
    )
  }

  const discount = coupon?.valid ? calculateDiscount(cart.total, coupon) : 0

  const applyCoupon = () => setCoupon(couponInput.trim() ? validateCoupon(db.coupons, couponInput) : null)

  const handleSubmit = (event) => {
    event.preventDefault()
    const soldOut = cart.lines.find((line) => line.quantity > line.session.availableSeats)
    if (soldOut) return setError(`No quedan suficientes lugares para “${soldOut.experience.title}”. Ajustá la cantidad en el carrito.`)

    const { bookings } = placeOrder({
      buyer: user,
      items: cart.lines.map(({ sessionId, quantity }) => ({ sessionId, quantity })),
      coupon: coupon?.valid ? db.coupons.find((entry) => entry.code === coupon.code) : null,
    })
    cart.clear()
    return setPlacedBookings(bookings)
  }

  return (
    <div className="container page">
      <PageHeader back={{ to: '/carrito', label: 'Volver al carrito' }} eyebrow="Checkout" title="Confirmá tu" accent="reserva." />

      <div className="split">
        <form id="checkout-form" className="card stack" onSubmit={handleSubmit}>
          <h2>Datos de contacto</h2>
          <div className="form-grid">
            <FormField label="Nombre completo" defaultValue={fullName(user)} required />
            <FormField label="Email" type="email" defaultValue={user.email} required />
          </div>

          <hr className="divider" />

          <h2>Cupón de descuento</h2>
          <div className="checkout__coupon">
            <FormField
              label="Código"
              value={couponInput}
              placeholder="Ej: PLANFINDE10"
              onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  applyCoupon()
                }
              }}
              error={coupon && !coupon.valid ? coupon.reason : undefined}
              hint={coupon?.valid ? `¡Listo! ${coupon.percentage}% de descuento aplicado.` : undefined}
            />
            <Button variant="secondary" onClick={applyCoupon}>
              Aplicar
            </Button>
          </div>

          <p className="checkout__notice">
            <Lock size={16} aria-hidden />
            Esta es una demo: no se procesan pagos reales.
          </p>
          {error && <p className="form-error">{error}</p>}
        </form>

        <OrderSummary items={toSummaryItems(cart.lines)} discount={discount} couponCode={coupon?.code} totalLabel="Total a pagar">
          <Button type="submit" form="checkout-form" full>
            Confirmar y pagar
          </Button>
        </OrderSummary>
      </div>
    </div>
  )
}

function CheckoutSuccess({ bookings }) {
  return (
    <div className="container page page--narrow checkout__success">
      <CircleCheck size={56} className="checkout__success-icon" aria-hidden />
      <span className="eyebrow">Reserva confirmada</span>
      <h1>
        Tu plan ya <em>es real.</em>
      </h1>
      <p className="muted">Guardá tus vouchers: los vas a necesitar al llegar. También los encontrás en Mis reservas.</p>
      <div className="stack checkout__vouchers">
        {bookings.map((booking) => (
          <VoucherCard key={booking.id} booking={booking} compact />
        ))}
      </div>
      <div className="row">
        <Button to="/mis-reservas">Ver mis reservas</Button>
        <Button to="/" variant="ghost">
          Seguir explorando
        </Button>
      </div>
    </div>
  )
}

export default CheckoutPage

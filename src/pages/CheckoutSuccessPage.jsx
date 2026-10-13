import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import VoucherCard from '../components/booking/VoucherCard'
import CheckoutSteps from '../components/checkout/CheckoutSteps'
import Button from '../components/ui/Button'
import Loading from '../components/ui/Loading'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { getOrder } from '../services/ordersService'
import { formatMoney, formatSessionDate } from '../utils/format'
import './CheckoutSuccessPage.css'

function CheckoutSuccessPage() {
  const { orderId } = useParams()
  const { state } = useLocation()
  const { user } = useAuth()
  const [order, setOrder] = useState(null)
  const [failed, setFailed] = useState(false)
  useDocumentTitle('Compra confirmada')

  // Traemos la orden recién creada (así funciona aunque se recargue la página)
  useEffect(() => {
    getOrder(orderId)
      .then((data) => setOrder(data))
      .catch(() => setFailed(true))
  }, [orderId])

  // Orden inexistente o de otro usuario
  if (failed) return <Navigate to="/mis-reservas" replace />
  if (!order) return <Loading text="Confirmando tu compra..." />

  const bookings = order.bookings ?? []

  return (
    <div className="container page page--narrow checkout-success">
      <CheckoutSteps current={2} />
      <div className="checkout-success__icon" aria-hidden>
        <Check size={44} />
      </div>
      <span className="eyebrow">Pago realizado</span>
      <h1>
        ¡Listo, tu plan <em>ya es real!</em>
      </h1>
      <p className="muted">
        {state?.paymentLabel ? `Pagaste ${formatMoney(order.total)} con ${state.paymentLabel}.` : `Pagaste ${formatMoney(order.total)}.`}{' '}
        Te enviamos el comprobante a {user.email}.
      </p>

      <dl className="checkout-success__receipt card">
        <div>
          <dt>N.º de orden</dt>
          <dd>#{order.id}</dd>
        </div>
        {order.discountAmount > 0 && (
          <div>
            <dt>Cupón {order.couponCode}</dt>
            <dd>−{formatMoney(order.discountAmount)}</dd>
          </div>
        )}
        <div>
          <dt>Total</dt>
          <dd>
            <strong>{formatMoney(order.total)}</strong>
          </dd>
        </div>
      </dl>

      <div className="checkout-success__vouchers">
        <h2>Tus vouchers</h2>
        <p className="muted small">Mostralos al anfitrión al llegar. También los encontrás en Mis reservas.</p>
        {bookings.map((booking) => (
          <div key={booking.id} className="checkout-success__voucher">
            <VoucherCard booking={booking} compact />
            <small className="muted">
              {formatSessionDate(booking.startsAt)} · {booking.quantity} {booking.quantity === 1 ? 'persona' : 'personas'}
            </small>
          </div>
        ))}
      </div>

      <div className="row checkout-success__actions">
        <Button to="/mis-reservas">Ver mis reservas</Button>
        <Button to="/" variant="ghost">
          Seguir explorando
        </Button>
      </div>
    </div>
  )
}

export default CheckoutSuccessPage

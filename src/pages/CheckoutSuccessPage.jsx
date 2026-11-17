import { useEffect } from 'react'
import { Check } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import VoucherCard from '../components/booking/VoucherCard'
import CheckoutSteps from '../components/checkout/CheckoutSteps'
import Approx from '../components/ui/Approx'
import Button from '../components/ui/Button'
import ErrorState from '../components/ui/ErrorState'
import Loading from '../components/ui/Loading'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { fetchOrderById } from '../redux/ordersSlice'
import { formatMoney, formatSessionDate } from '../utils/format'
import './CheckoutSuccessPage.css'

// Qué pasa con el regalo según su estado (lo calcula el back)
const GIFT_TEXT = {
  DELIVERED: (order) => `Es un regalo para ${order.giftRecipientName}: ya lo tiene en sus reservas.`,
  PENDING: (order) =>
    `Es un regalo para ${order.giftRecipientName}: le avisamos por mail y se lo pasamos cuando entre a PLAN con ${order.giftRecipientEmail}. Hasta entonces el voucher es tuyo y podés corregir el email desde la reserva.`,
  IN_PERSON: (order) => `Es un regalo para ${order.giftRecipientName}: el voucher está en Mis reservas para que se lo des.`,
}

function CheckoutSuccessPage() {
  const { orderId } = useParams()
  const { state } = useLocation()
  const dispatch = useDispatch()
  const order = useSelector((state) => state.orders.items.find((entry) => entry.id === Number(orderId)) ?? state.orders.details[orderId]?.item)
  const detail = useSelector((state) => state.orders.details[orderId])
  useDocumentTitle('Compra confirmada')

  // Recién comprada, la orden ya está en el store (la guardó createOrder): no hace falta pedirla.
  // Solo se pide si se recargó la página
  useEffect(() => {
    if (!order && !detail) dispatch(fetchOrderById(orderId))
  }, [order, detail, orderId, dispatch])

  // Orden inexistente o de otro usuario
  if (detail?.notFound) return <Navigate to="/mis-reservas" replace />
  // La compra ya se hizo: si no podemos mostrar el detalle, igual se puede ver en Mis reservas
  if (detail?.error) {
    return (
      <div className="container page page--narrow">
        <ErrorState title="Tu compra se hizo, pero no pudimos mostrar el detalle" message={detail.error}>
          <Button to="/mis-reservas">Ver mis reservas</Button>
        </ErrorState>
      </div>
    )
  }
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
        {order.giftRecipientName ? GIFT_TEXT[order.giftStatus](order) : 'Tus vouchers quedaron guardados en Mis reservas.'}
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
            <Approx value={order.total} />
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

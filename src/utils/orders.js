import { formatMoney } from './format'

/** Cálculos de órdenes que muestra el front (el back ya devuelve subtotal, descuento y total). */

export function getFinalPrice({ price, discountPercentage }) {
  return Math.round(price * (1 - (discountPercentage || 0) / 100))
}

export function calculateDiscount(subtotal, coupon) {
  return coupon ? Math.round((subtotal * coupon.percentage) / 100) : 0
}

/** Lo que se devuelve de una reserva: su parte del total, prorrateando el cupón si hubo. */
export function getRefundAmount(booking, order) {
  const gross = Number(booking.unitPrice ?? 0) * Number(booking.quantity ?? 0)
  const subtotal = Number(order?.subtotal ?? 0)
  const total = Number(order?.total ?? 0)
  return subtotal ? Math.round((gross * total) / subtotal) : gross
}

/** Total reembolsado de una orden (usa las reservas que vienen dentro de la orden). */
export function getOrderRefunded(order) {
  return (order.bookings ?? [])
    .filter((booking) => booking.refunded)
    .reduce((sum, booking) => sum + getRefundAmount(booking, order), 0)
}

/** Ventas netas: lo cobrado menos lo devuelto. */
export function getNetSales(orders) {
  return orders.reduce((sum, order) => sum + Number(order.total ?? 0) - getOrderRefunded(order), 0)
}

/** Convierte líneas de carrito (o reservas) al formato de <OrderSummary>. */
export function toSummaryItems(lines) {
  return lines.map((line) => ({
    id: line.sessionId ?? line.id,
    label: line.experience?.title ?? line.experienceTitle,
    detail: `${line.quantity} × ${formatMoney(line.unitPrice ?? line.experience.finalPrice)}`,
    amount: line.subtotal ?? line.unitPrice * line.quantity,
  }))
}

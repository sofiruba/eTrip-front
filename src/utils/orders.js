import { formatMoney } from './format'

/** Cálculos de órdenes que muestra el front (el back ya devuelve subtotal, descuento y total). */

export function getFinalPrice({ price, discountPercentage }) {
  return Math.round(price * (1 - (discountPercentage || 0) / 100))
}

/** Lo que se devuelve de una reserva: su parte del total, prorrateando el cupón si hubo. */
export function getRefundAmount(booking, order) {
  const gross = Number(booking.unitPrice ?? 0) * Number(booking.quantity ?? 0)
  const subtotal = Number(order?.subtotal ?? 0)
  const total = Number(order?.total ?? 0)
  return subtotal ? Math.round((gross * total) / subtotal) : gross
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

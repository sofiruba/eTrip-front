import { formatMoney } from './format'

/** Cálculos de órdenes que muestra el front (el back ya devuelve subtotal, descuento y total). */

export function getFinalPrice({ price, discountPercentage }) {
  return Math.round(price * (1 - (discountPercentage || 0) / 100))
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

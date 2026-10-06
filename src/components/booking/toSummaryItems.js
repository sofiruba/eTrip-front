import { formatMoney } from '../../utils/format'

/** Convierte líneas de carrito (o reservas) al formato de <OrderSummary>. */
export function toSummaryItems(lines) {
  return lines.map((line) => ({
    id: line.sessionId ?? line.id,
    label: line.experience?.title ?? line.experienceTitle,
    detail: `${line.quantity} × ${formatMoney(line.unitPrice ?? line.experience.finalPrice)}`,
    amount: line.subtotal ?? line.unitPrice * line.quantity,
  }))
}

import { formatTime } from './format'

/**
 * Texto de la política de cancelación. El plazo (refundableUntil) lo manda el back en cada fecha (para el checkout)
 * y en cada reserva, junto con si quien la mira la puede cancelar (refundable). Para una fecha que todavía no se
 * compró, se puede cancelar si el plazo no pasó.
 */
export function describeCancellation(refundableUntil, refundable = new Date(refundableUntil) > new Date()) {
  if (!refundable || !refundableUntil) {
    return { refundable: false, title: 'No reembolsable', text: 'Esta reserva ya no admite reembolso.' }
  }
  const until = new Date(refundableUntil)
  const day = until.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }).replace('.', '')
  return {
    refundable: true,
    title: 'Cancelación gratuita',
    text: `Si cancelás antes del ${day}, ${formatTime(refundableUntil)}, recibís un reembolso total.`,
  }
}

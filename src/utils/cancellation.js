import { formatTime } from './format'

/** Regla del front: reembolso total si se cancela hasta 48 h antes del inicio. */
export const FREE_CANCELLATION_HOURS = 48

export function getCancellationPolicy(startsAt, now = Date.now()) {
  const deadline = new Date(new Date(startsAt).getTime() - FREE_CANCELLATION_HOURS * 3600000)
  const refundable = deadline.getTime() > now
  const day = deadline.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }).replace('.', '')
  return {
    refundable,
    deadline,
    title: refundable ? 'Cancelación gratuita' : 'No reembolsable',
    text: refundable
      ? `Si cancelás antes del ${day}, ${formatTime(deadline)}, recibís un reembolso total.`
      : `Faltan menos de ${FREE_CANCELLATION_HOURS} h para la experiencia: esta reserva no admite reembolso.`,
  }
}

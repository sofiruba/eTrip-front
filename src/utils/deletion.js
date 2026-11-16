import { pluralize } from './format'

/**
 * Textos de "dar de baja una experiencia" (DELETE /experiences/{id}). Regla de PLAN: si el anfitrión la cancela,
 * todas las reservas vigentes se reembolsan y cada persona recibe un aviso. Los usan Mis experiencias y el panel.
 */

/** Resumen de lo que va a pasar: fechas futuras que se cancelan y reservas vigentes que se reembolsan. */
export function describeDeletion(experience, bookings) {
  const active = bookings.filter((booking) => booking.experienceId === experience.id && !booking.isPast && !booking.refunded)
  const refunds = active.length
  const sessions = experience.upcomingCount ?? 0
  if (!sessions) return `“${experience.title}” deja de estar publicada. No tiene fechas próximas, así que nadie se ve afectado.`
  const dates = pluralize(sessions, 'fecha próxima', 'fechas próximas')
  if (!refunds) return `“${experience.title}” deja de estar publicada y se cancelan sus ${dates} (todavía sin reservas).`
  return (
    `“${experience.title}” deja de estar publicada y se cancelan sus ${dates}. ` +
    `Las ${pluralize(refunds, 'reserva vigente', 'reservas vigentes')} se reembolsan completas y cada persona recibe un aviso. ` +
    'Esa plata no se te paga. No se puede deshacer.'
  )
}

/** Texto del aviso con lo que devolvió el back: { removed, cancelledSessions, refundedBookings }. */
export function describeDeletionResult(result) {
  if (!result?.cancelledSessions) return 'Experiencia dada de baja'
  const parts = [pluralize(result.cancelledSessions, 'fecha cancelada', 'fechas canceladas')]
  if (result.refundedBookings) parts.push(`${pluralize(result.refundedBookings, 'reserva reembolsada', 'reservas reembolsadas')} y avisadas`)
  return `Experiencia dada de baja: ${parts.join(', ')}.`
}

/** Estado visible de una reserva → { label, tone } para <Badge>. */
export function getBookingStatus(booking) {
  if (booking.refunded) return { label: 'Reembolsada', tone: 'danger' }
  if (booking.isPast) return { label: 'Finalizada', tone: 'neutral' }
  return { label: 'Confirmada', tone: 'success' }
}

import { isPast } from './format'
import { byStartsAt } from './experiences'

/** Le agrega a cada reserva su experiencia (para la foto y el lugar) y si ya pasó. */
export function addBookingInfo(bookings, experiences = []) {
  return bookings
    .map((booking) => ({
      ...booking,
      experience: experiences.find((experience) => experience.id === booking.experienceId),
      isPast: isPast(booking.startsAt),
    }))
    .sort(byStartsAt)
}

/** Separa en próximas y pasadas (las reembolsadas van con las pasadas). */
export function splitBookings(bookings) {
  return {
    upcoming: bookings.filter((booking) => !booking.isPast && !booking.refunded),
    past: bookings.filter((booking) => booking.isPast || booking.refunded).reverse(),
  }
}

/** Estado visible de una reserva → { label, tone } para <Badge>. */
export function getBookingStatus(booking) {
  if (booking.refunded) return { label: 'Reembolsada', tone: 'danger' }
  if (booking.isPast) return { label: 'Finalizada', tone: 'neutral' }
  return { label: 'Confirmada', tone: 'success' }
}

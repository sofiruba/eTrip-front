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

// El estado de la reserva lo calcula el back (booking.status): acá solo se elige el texto y el color
const BOOKING_STATUS = {
  CONFIRMED: { label: 'Confirmada', tone: 'success' },
  COMPLETED: { label: 'Finalizada', tone: 'neutral' },
  REFUNDED: { label: 'Reembolsada', tone: 'danger' },
}

/** Estado visible de una reserva → { label, tone } para <Badge>. */
export const getBookingStatus = (booking) => BOOKING_STATUS[booking.status] ?? BOOKING_STATUS.CONFIRMED

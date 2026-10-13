import { isPast, pluralize } from './format'

/**
 * Une los ítems del carrito con su experiencia y su sesión (para mostrar foto,
 * lugar y lugares disponibles). Los que ya no existen quedan afuera.
 */
export function buildCartLines(items, experiences, sessions) {
  return items
    .map((item) => ({
      ...item,
      sessionId: item.experienceSessionId,
      experience: experiences.find((experience) => experience.id === item.experienceId),
      session: sessions.find((session) => session.id === item.experienceSessionId),
      subtotal: Number(item.subtotal),
    }))
    .filter((line) => line.experience && line.session)
}

/** Problema que impide pagar una línea (o null): fecha pasada, agotada o con menos lugares que los pedidos. */
export function getCartProblem({ session, quantity }) {
  if (isPast(session.startsAt)) return 'Esta fecha ya pasó.'
  if (session.availableSeats === 0) return 'Se agotaron los lugares de esta fecha.'
  if (quantity > session.availableSeats) return `Solo quedan ${pluralize(session.availableSeats, 'lugar', 'lugares')}.`
  return null
}

import { isPast, pluralize } from './format'

/**
 * Une los ítems del carrito con su experiencia (foto, categoría, lugar) y su sesión (lugares disponibles).
 * Si la fecha ya no está en el catálogo (pasó, el anfitrión la canceló o pausó la experiencia), la línea
 * queda igual con `unavailable: true`: sigue en el carrito del back y en el total, así que se tiene que ver
 * para poder quitarla. El ítem del back trae `experienceTitle` y `startsAt` para mostrarla igual.
 */
export function buildCartLines(items, experiences, sessions) {
  return items.map((item) => {
    const session = sessions.find((entry) => entry.id === item.experienceSessionId) ?? null
    return {
      ...item,
      sessionId: item.experienceSessionId,
      experience: experiences.find((experience) => experience.id === item.experienceId) ?? null,
      session,
      unavailable: !session,
      subtotal: Number(item.subtotal),
    }
  })
}

/** Problema que impide pagar una línea (o null): fecha que ya no está, pasada, agotada o con menos lugares que los pedidos. */
export function getCartProblem({ session, quantity, unavailable }) {
  if (unavailable) return 'Esta fecha ya no está disponible: pasó, el anfitrión la canceló o pausó la experiencia.'
  if (isPast(session.startsAt)) return 'Esta fecha ya pasó.'
  if (session.availableSeats === 0) return 'Se agotaron los lugares de esta fecha.'
  if (quantity > session.availableSeats) return `Solo quedan ${pluralize(session.availableSeats, 'lugar', 'lugares')}.`
  return null
}

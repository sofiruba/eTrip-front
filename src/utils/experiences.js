import { isPast } from './format'
import { getCity } from './location'
import { cities } from '../data/cities'

/**
 * Funciones para trabajar con las listas que llegan del back
 * (experiencias y sesiones). No hacen llamadas: solo calculan.
 */

export const byStartsAt = (a, b) => new Date(a.startsAt) - new Date(b.startsAt)
export const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt)

// Con esta cantidad de lugares o menos se avisa "¡Quedan pocos!"
export const LOW_SEATS = 5

/** Fechas futuras y activas de una experiencia, ordenadas. */
export function getUpcomingSessions(sessions, experienceId) {
  return sessions
    .filter((session) => session.experienceId === experienceId && session.active && !isPast(session.startsAt))
    .sort(byStartsAt)
}

/**
 * Le suma a cada experiencia datos de sus fechas, para las tarjetas y los filtros:
 * la próxima fecha con lugar, cuántas fechas tiene y cuántos lugares quedan.
 */
export function addSessionInfo(experiences, sessions) {
  return experiences.map((experience) => {
    const upcoming = getUpcomingSessions(sessions, experience.id)
    return {
      ...experience,
      nextSession: upcoming.find((session) => session.availableSeats > 0) ?? null,
      upcomingCount: upcoming.length,
      availableSeats: upcoming.reduce((sum, session) => sum + session.availableSeats, 0),
    }
  })
}

/** Tiene fechas futuras pero ninguna con lugares. */
export const isSoldOut = (experience) => experience.upcomingCount > 0 && experience.availableSeats === 0

const SORTERS = {
  'precio-asc': (a, b) => a.finalPrice - b.finalPrice,
  'precio-desc': (a, b) => b.finalPrice - a.finalPrice,
  puntuacion: (a, b) => b.averageRating - a.averageRating || b.reviewCount - a.reviewCount,
  proximas: (a, b) => {
    if (!a.nextSession || !b.nextSession) return a.nextSession ? -1 : b.nextSession ? 1 : 0
    return byStartsAt(a.nextSession, b.nextSession)
  },
}

/** Orden del catálogo (el back no ordena). Por defecto, primero lo que se puede reservar. */
export function sortExperiences(experiences, sort) {
  const fallback = (a, b) => Number(Boolean(b.nextSession)) - Number(Boolean(a.nextSession))
  return [...experiences].sort(SORTERS[sort] ?? fallback)
}

/** Ciudades que tienen experiencias, con cuántas tiene cada una (para el buscador). */
export function getDestinations(experiences) {
  const counts = new Map()
  experiences.forEach((experience) => {
    const city = getCity(experience.location)
    if (city) counts.set(city, (counts.get(city) ?? 0) + 1)
  })
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count, country: cities.find((city) => city.name === name)?.country }))
    .sort((a, b) => b.count - a.count)
}

/** Días ("YYYY-MM-DD") con alguna sesión futura con lugar, para marcarlos en el calendario. */
export function getAvailableDates(sessions) {
  return new Set(
    sessions
      .filter((session) => session.active && session.availableSeats > 0 && !isPast(session.startsAt))
      .map((session) => session.startsAt.slice(0, 10)),
  )
}

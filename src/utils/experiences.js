import { isPast, normalizeText } from './format'
import { getCity, matchesLocation } from './location'
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

/** Filtros del catálogo (los mismos nombres que la URL del Home). */
export function filterExperiences(experiences, sessions, filters) {
  const { title, categoryId, location, minPrice, maxPrice, onlyDiscounted, dateFrom, dateTo, guests, onlyAvailable } = filters
  const words = normalizeText(title).split(/\s+/).filter(Boolean)
  const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null
  const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null

  return experiences.filter((experience) => {
    if (categoryId && experience.categoryId !== categoryId) return false
    if (location && !matchesLocation(experience.location, location)) return false
    if (minPrice != null && experience.finalPrice < minPrice) return false
    if (maxPrice != null && experience.finalPrice > maxPrice) return false
    if (onlyDiscounted && !(experience.discountPercentage > 0)) return false
    if (onlyAvailable && !experience.nextSession) return false
    // Fechas y personas: tiene que haber una sesión en el rango con lugar para todos
    if (from || to || guests) {
      const fits = getUpcomingSessions(sessions, experience.id).some((session) => {
        const start = new Date(session.startsAt)
        return session.availableSeats >= (guests || 1) && (!from || start >= from) && (!to || start <= to)
      })
      if (!fits) return false
    }
    const searchable = normalizeText(`${experience.title} ${experience.location} ${experience.publisherName}`)
    return words.every((word) => searchable.includes(word))
  })
}

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

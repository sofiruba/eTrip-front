import { fullName, isPast, normalizeText } from '../utils/format'
import { getCity, matchesLocation } from '../utils/location'
import { cities } from './cities'
import { getFinalPrice } from '../utils/orders'

/**
 * Funciones puras para leer la "base" en memoria.
 * Arman los mismos campos calculados que devuelven los DTOs del back.
 */

export function findById(items, id) {
  return items.find((item) => item.id === Number(id))
}

export const byStartsAt = (a, b) => new Date(a.startsAt) - new Date(b.startsAt)
export const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt)

/* Experiencias */

export function getRating(reviews, experienceId) {
  const list = reviews.filter((review) => review.experienceId === experienceId)
  const average = list.length ? list.reduce((sum, review) => sum + review.rating, 0) / list.length : 0
  return { averageRating: Math.round(average * 10) / 10, reviewCount: list.length }
}

export function getUpcomingSessions(db, experienceId) {
  return db.sessions
    .filter((session) => session.experienceId === experienceId && session.active && !isPast(session.startsAt))
    .sort(byStartsAt)
}

export function toExperienceDTO(db, experience) {
  const upcomingSessions = getUpcomingSessions(db, experience.id)
  return {
    ...experience,
    finalPrice: getFinalPrice(experience),
    categoryName: findById(db.categories, experience.categoryId)?.name ?? 'Sin categoría',
    publisherName: fullName(findById(db.users, experience.publisherId)),
    ...getRating(db.reviews, experience.id),
    // La próxima fecha que de verdad se puede reservar
    nextSession: upcomingSessions.find((session) => session.availableSeats > 0) ?? null,
    upcomingCount: upcomingSessions.length,
    availableSeats: upcomingSessions.reduce((sum, session) => sum + session.availableSeats, 0),
  }
}

/** Hay fechas futuras pero ninguna con lugares. */
export const isSoldOut = (experience) => experience.upcomingCount > 0 && experience.availableSeats === 0

export const LOW_SEATS = 5

/**
 * Mismos filtros que GET /experiences del back (title, categoryId, location, minPrice,
 * maxPrice, onlyDiscounted, dateFrom, dateTo, youngestAge). `guests` y `onlyAvailable` son solo del front.
 */
export function filterExperiences(db, experiences, filters) {
  const { title, categoryId, location, minPrice, maxPrice, onlyDiscounted, dateFrom, dateTo, guests, youngestAge, onlyAvailable } = filters
  const words = normalizeText(title).split(/\s+/).filter(Boolean)
  const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null
  const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null

  return experiences.filter((experience) => {
    if (experience.active === false) return false
    if (categoryId && experience.categoryId !== categoryId) return false
    if (location && !matchesLocation(experience.location, location)) return false
    if (minPrice != null && experience.finalPrice < minPrice) return false
    if (maxPrice != null && experience.finalPrice > maxPrice) return false
    if (onlyDiscounted && !(experience.discountPercentage > 0)) return false
    if (onlyAvailable && !experience.nextSession) return false
    // Con niños o bebés, solo experiencias que los admiten
    if (youngestAge != null && (experience.minAge ?? 0) > youngestAge) return false
    // Fechas y personas: tiene que haber una sesión en el rango con lugar para todos
    if (from || to || guests) {
      const fits = getUpcomingSessions(db, experience.id).some((session) => {
        const start = new Date(session.startsAt)
        return session.availableSeats >= (guests || 1) && (!from || start >= from) && (!to || start <= to)
      })
      if (!fits) return false
    }
    // En el mock buscamos en más campos que el back (que solo mira el título)
    const searchable = normalizeText(`${experience.title} ${experience.subtitle} ${experience.location} ${experience.publisherName}`)
    return words.every((word) => searchable.includes(word))
  })
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

const SORTERS = {
  'precio-asc': (a, b) => a.finalPrice - b.finalPrice,
  'precio-desc': (a, b) => b.finalPrice - a.finalPrice,
  puntuacion: (a, b) => b.averageRating - a.averageRating || b.reviewCount - a.reviewCount,
  proximas: (a, b) => {
    if (!a.nextSession || !b.nextSession) return a.nextSession ? -1 : b.nextSession ? 1 : 0
    return byStartsAt(a.nextSession, b.nextSession)
  },
}

/** Orden del catálogo. Lo hace el front porque el back no recibe `sort`. */
export function sortExperiences(experiences, sort) {
  // Por defecto: primero lo que se puede reservar
  const fallback = (a, b) => Number(Boolean(b.nextSession)) - Number(Boolean(a.nextSession))
  return [...experiences].sort(SORTERS[sort] ?? fallback)
}

/* Reseñas */

export function toReviewDTO(db, review) {
  const author = findById(db.users, review.userId)
  return {
    ...review,
    userName: fullName(author),
    userAvatarUrl: author?.avatarUrl ?? null,
    experienceTitle: findById(db.experiences, review.experienceId)?.title ?? 'Experiencia eliminada',
  }
}

export function getReviews(db, filter = () => true) {
  return db.reviews.filter(filter).map((review) => toReviewDTO(db, review)).sort(byNewest)
}

/* Reservas y órdenes */

export function toBookingView(db, booking) {
  return {
    ...booking,
    experience: findById(db.experiences, booking.experienceId),
    isPast: isPast(booking.startsAt),
  }
}

export function getBookings(db, filter = () => true) {
  return db.bookings.filter(filter).map((booking) => toBookingView(db, booking)).sort(byStartsAt)
}

export function splitBookings(bookings) {
  return {
    upcoming: bookings.filter((booking) => !booking.isPast && !booking.refunded),
    past: bookings.filter((booking) => booking.isPast || booking.refunded).reverse(),
  }
}

export function getHostBookings(db) {
  const sales = db.hostBookings ?? []
  return sales
    .map((booking) => toBookingView(db, booking))
    .sort(byStartsAt)
}

export function getUserStats(db, userId) {
  return {
    bookings: db.bookings.filter((booking) => booking.buyerId === userId && !booking.refunded).length,
    reviews: db.reviews.filter((review) => review.userId === userId).length,
    published: db.experiences.filter((experience) => experience.publisherId === userId).length,
  }
}

/* Cupones (misma respuesta que CouponValidationDTO) */

/** Órdenes que usaron el cupón (`usedCount` del DTO del back). */
export function getCouponUsage(db, coupon) {
  return db.orders.filter((order) => order.couponCode === coupon.code).length
}

/** Mismas reglas que el back: activo, vigente, con usos disponibles y una sola vez por usuario. */
export function validateCoupon(db, rawCode, userId) {
  const code = rawCode.trim().toUpperCase()
  const coupon = db.coupons.find((entry) => entry.code === code)
  const now = Date.now()

  let reason = null
  if (!coupon) reason = 'El cupón no existe.'
  else if (!coupon.active) reason = 'El cupón no está activo.'
  else if (now < new Date(coupon.validFrom).getTime()) reason = 'El cupón todavía no está vigente.'
  else if (now > new Date(coupon.validUntil).getTime()) reason = 'El cupón está vencido.'
  else if (coupon.maxUses != null && getCouponUsage(db, coupon) >= coupon.maxUses) reason = 'El cupón ya alcanzó su límite de usos.'
  else if (db.orders.some((order) => order.userId === userId && order.couponCode === code)) reason = 'Ya usaste este cupón en otra compra.'

  return { code, valid: !reason, reason, percentage: reason ? 0 : coupon.percentage }
}

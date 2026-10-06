import { fullName, isPast } from '../utils/format'
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
    nextSession: upcomingSessions[0] ?? null,
    availableSeats: upcomingSessions.reduce((sum, session) => sum + session.availableSeats, 0),
  }
}

export function filterExperiences(experiences, { query = '', categoryId = null }) {
  const text = query.trim().toLowerCase()
  return experiences.filter((experience) => {
    const matchesCategory = !categoryId || experience.categoryId === categoryId
    const searchable = `${experience.title} ${experience.subtitle} ${experience.location} ${experience.publisherName}`
    return matchesCategory && searchable.toLowerCase().includes(text)
  })
}

/* Reseñas */

export function toReviewDTO(db, review) {
  return {
    ...review,
    userName: fullName(findById(db.users, review.userId)),
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

export function getHostBookings(db, hostId) {
  const hostExperienceIds = db.experiences
    .filter((experience) => experience.publisherId === hostId)
    .map((experience) => experience.id)
  return getBookings(db, (booking) => hostExperienceIds.includes(booking.experienceId))
}

export function getUserStats(db, userId) {
  return {
    bookings: db.bookings.filter((booking) => booking.buyerId === userId && !booking.refunded).length,
    reviews: db.reviews.filter((review) => review.userId === userId).length,
    published: db.experiences.filter((experience) => experience.publisherId === userId).length,
  }
}

/* Cupones (misma respuesta que CouponValidationDTO) */

export function validateCoupon(coupons, rawCode) {
  const code = rawCode.trim().toUpperCase()
  const coupon = coupons.find((entry) => entry.code === code)
  const now = Date.now()

  let reason = null
  if (!coupon) reason = 'El cupón no existe.'
  else if (!coupon.active) reason = 'El cupón no está activo.'
  else if (now < new Date(coupon.validFrom).getTime()) reason = 'El cupón todavía no está vigente.'
  else if (now > new Date(coupon.validUntil).getTime()) reason = 'El cupón está vencido.'

  return { code, valid: !reason, reason, percentage: reason ? 0 : coupon.percentage }
}

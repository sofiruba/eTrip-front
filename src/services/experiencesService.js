import { request, requestList } from './api'

/**
 * El back manda las fotos en base64 (`imagesBase64`). Las pasamos a un formato
 * que entiende <img src> y dejamos los precios como números.
 */
export function toExperience(data) {
  return {
    ...data,
    images: (data.imagesBase64 ?? []).map((image) => `data:image/jpeg;base64,${image}`),
    price: Number(data.price),
    finalPrice: Number(data.finalPrice ?? data.price),
    discountPercentage: Number(data.discountPercentage ?? 0),
    averageRating: data.averageRating ?? 0,
    reviewCount: data.reviewCount ?? 0,
  }
}

/** Arma el FormData que espera el back: la parte "experience" (JSON) y las fotos nuevas. */
export function toFormData(experience, photos) {
  const form = new FormData()
  const { title, description, price, location, categoryId } = experience
  form.append('experience', JSON.stringify({ title, description, price, location, categoryId }))
  photos.forEach((photo) => form.append('images', photo))
  return form
}

// Catálogo público (solo activas)
export const getExperiences = () => requestList('/experiences').then((list) => list.map(toExperience))

// Panel de admin: también trae las desactivadas
export const getAllExperiences = () =>
  requestList('/experiences?includeInactive=true').then((list) => list.map(toExperience))

// Las del anfitrión que inició sesión (incluye desactivadas)
export const getMyExperiences = () => requestList('/experiences/mine').then((list) => list.map(toExperience))

export const getExperiencesByHost = (hostId) =>
  requestList(`/experiences?publisherId=${hostId}`).then((list) => list.map(toExperience))

export const getExperience = (id) => request(`/experiences/${id}`).then(toExperience)

export const createExperience = (experience, photos) =>
  request('/experiences', 'POST', toFormData(experience, photos)).then(toExperience)

export const updateExperience = (id, experience, photos) =>
  request(`/experiences/${id}`, 'PUT', toFormData(experience, photos)).then(toExperience)

export const updateDiscount = (id, discountPercentage) =>
  request(`/experiences/${id}/discount`, 'PATCH', { discountPercentage }).then(toExperience)

export const updateExperienceStatus = (id, active) =>
  request(`/experiences/${id}/status?active=${active}`, 'PATCH').then(toExperience)

export const deleteExperience = (id) => request(`/experiences/${id}`, 'DELETE')

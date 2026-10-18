import { request, requestList } from './api'

export const getReviewsByExperience = (experienceId) => requestList(`/reviews/experience/${experienceId}`)
export const getMyReviews = () => requestList('/reviews/mine')

// Administrador: todas las reseñas
export const getReviews = () => requestList('/reviews')

// review = { experienceId, rating, comment }. El back no permite editar reseñas.
export const createReview = (review) => request('/reviews', 'POST', review)
export const deleteReview = (id) => request(`/reviews/${id}`, 'DELETE')

// Anfitrión de la experiencia: responde (o edita / borra con texto vacío) una reseña
export const replyToReview = (id, reply) => request(`/reviews/${id}/reply`, 'PUT', { reply })

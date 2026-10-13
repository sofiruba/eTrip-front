import { request } from './api'

export const getCart = (userId) => request(`/carts/user/${userId}`)

export const addToCart = (sessionId, quantity) =>
  request('/carts/items', 'POST', { experienceSessionId: sessionId, quantity })

export const updateCartItem = (userId, itemId, quantity) =>
  request(`/carts/user/${userId}/items/${itemId}?quantity=${quantity}`, 'PATCH')

export const removeCartItem = (userId, itemId) => request(`/carts/user/${userId}/items/${itemId}`, 'DELETE')

export const clearCart = (userId) => request(`/carts/user/${userId}`, 'DELETE')

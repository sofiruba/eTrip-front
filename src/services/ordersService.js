import { request, requestList } from './api'

// Cliente: sus órdenes. Administrador: todas.
export const getOrders = () => requestList('/orders')
export const getOrder = (id) => request(`/orders/${id}`)

// Compra todo lo que hay en el carrito
export const createOrder = (couponCode) => request('/orders', 'POST', { couponCode: couponCode || null })

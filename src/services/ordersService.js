import { request, requestList } from './api'

// Cliente: sus órdenes. Administrador: todas.
export const getOrders = () => requestList('/orders')
export const getOrder = (id) => request(`/orders/${id}`)

// Paga (simulado) y compra todo lo que hay en el carrito. payment = { couponCode, paymentMethod, cardNumber }
export const createOrder = (payment) => request('/orders', 'POST', payment)

// Administrador: ventas netas y comisión de PLAN → { orderCount, grossSales, refunded, netSales, commission, commissionRate }
export const getOrderStats = () => request('/orders/stats')

// Administrador: cancela la orden entera (el back reembolsa sus reservas que todavía no empezaron)
export const cancelOrder = (id) => request(`/orders/${id}/cancel`, 'POST')

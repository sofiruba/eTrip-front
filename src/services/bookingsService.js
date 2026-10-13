import { request, requestList } from './api'

// Cliente: sus reservas. Administrador: todas.
export const getBookings = () => requestList('/bookings')

// Anfitrión: las reservas de sus experiencias
export const getSales = () => requestList('/bookings/sales')

export const getBooking = (id) => request(`/bookings/${id}`)
export const refundBooking = (id) => request(`/bookings/${id}/refund`, 'POST')

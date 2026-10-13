import { request, requestList } from './api'

// → { code, valid, reason, percentage }
export const validateCoupon = (code) => request(`/discount-coupons/validate?code=${encodeURIComponent(code)}`)

// Solo administradores
export const getCoupons = () => requestList('/discount-coupons')
export const createCoupon = (coupon) => request('/discount-coupons', 'POST', coupon)
export const updateCoupon = (id, coupon) => request(`/discount-coupons/${id}`, 'PUT', coupon)
export const deleteCoupon = (id) => request(`/discount-coupons/${id}`, 'DELETE')

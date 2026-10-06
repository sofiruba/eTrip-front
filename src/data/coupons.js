import { daysFromToday } from './dates'

// Forma de DiscountCouponResponseDTO
export const coupons = [
  { id: 1, code: 'PLANFINDE10', percentage: 10, validFrom: daysFromToday(-30, '00:00'), validUntil: daysFromToday(60, '23:59'), active: true },
  { id: 2, code: 'BIENVENIDA20', percentage: 20, validFrom: daysFromToday(-90, '00:00'), validUntil: daysFromToday(90, '23:59'), active: false },
  { id: 3, code: 'PRIMAVERA15', percentage: 15, validFrom: daysFromToday(-60, '00:00'), validUntil: daysFromToday(-5, '23:59'), active: true },
]

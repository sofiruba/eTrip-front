import { isPast } from './format'

/** Estado visible de un cupón en el panel. */
export function getCouponStatus(coupon) {
  if (!coupon.active) return { label: 'Inactivo', tone: 'neutral' }
  if (isPast(coupon.validUntil)) return { label: 'Vencido', tone: 'danger' }
  if (!isPast(coupon.validFrom)) return { label: 'Programado', tone: 'warning' }
  return { label: 'Activo', tone: 'success' }
}

// Motivos que devuelve GET /discount-coupons/validate cuando un cupón no sirve
const REASONS = {
  NOT_FOUND: 'No existe un cupón con ese código.',
  INACTIVE: 'Este cupón ya no está activo.',
  INVALID_PERCENTAGE: 'Este cupón no tiene un descuento válido.',
  NOT_YET_VALID: 'Este cupón todavía no está vigente.',
  EXPIRED: 'Este cupón venció.',
  ALREADY_USED: 'Ya usaste este cupón en otra compra.',
}

/** Texto para el usuario del motivo por el que un cupón no es válido. */
export const describeCouponReason = (reason) => REASONS[reason] ?? 'Este cupón no es válido.'

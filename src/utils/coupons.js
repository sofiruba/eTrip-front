import { isPast } from './format'

/** Estado visible de un cupón en el panel. */
export function getCouponStatus(coupon) {
  if (!coupon.active) return { label: 'Inactivo', tone: 'neutral' }
  if (isPast(coupon.validUntil)) return { label: 'Vencido', tone: 'danger' }
  if (!isPast(coupon.validFrom)) return { label: 'Programado', tone: 'warning' }
  return { label: 'Activo', tone: 'success' }
}

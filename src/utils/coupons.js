import { isPast } from './format'

/** Estado visible de un cupón en el panel. `used` = órdenes que ya lo usaron. */
export function getCouponStatus(coupon, used) {
  if (!coupon.active) return { label: 'Inactivo', tone: 'neutral' }
  if (isPast(coupon.validUntil)) return { label: 'Vencido', tone: 'danger' }
  if (coupon.maxUses != null && used >= coupon.maxUses) return { label: 'Agotado', tone: 'danger' }
  if (!isPast(coupon.validFrom)) return { label: 'Programado', tone: 'warning' }
  return { label: 'Activo', tone: 'success' }
}

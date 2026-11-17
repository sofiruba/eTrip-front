// El estado de cada cupón lo calcula el back (status): acá solo se elige el texto y el color
const COUPON_STATUS = {
  ACTIVE: { label: 'Activo', tone: 'success' },
  NOT_YET_VALID: { label: 'Programado', tone: 'warning' },
  EXPIRED: { label: 'Vencido', tone: 'danger' },
  INACTIVE: { label: 'Inactivo', tone: 'neutral' },
}

export const getCouponStatus = (coupon) => COUPON_STATUS[coupon.status] ?? COUPON_STATUS.INACTIVE

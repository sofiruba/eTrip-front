/**
 * Lógica de órdenes compartida entre los datos semilla y el checkout.
 * Replica lo que hace OrderServiceImpl en el back: una orden agrupa
 * una reserva (booking) por cada sesión comprada.
 */

export function getFinalPrice(experience) {
  return Math.round(experience.price * (1 - (experience.discountPercentage || 0) / 100))
}

export function createVoucherCode(id) {
  const code = ((id * 7919 + 104729) * 2654435761 % 2176782336).toString(36).toUpperCase()
  return `ETRIP-${code.padStart(6, '0').slice(-6)}`
}

export function calculateDiscount(subtotal, coupon) {
  return coupon ? Math.round((subtotal * coupon.percentage) / 100) : 0
}

export function buildOrder({ orderId, firstBookingId, buyer, items, coupon, createdAt, sessions, experiences }) {
  const bookings = items.map((item, index) => {
    const session = sessions.find((entry) => entry.id === item.sessionId)
    const experience = experiences.find((entry) => entry.id === session.experienceId)
    const id = firstBookingId + index
    return {
      id,
      voucherCode: createVoucherCode(id),
      orderId,
      experienceSessionId: session.id,
      experienceId: experience.id,
      experienceTitle: experience.title,
      startsAt: session.startsAt,
      endsAt: session.endsAt,
      quantity: item.quantity,
      unitPrice: getFinalPrice(experience),
      createdAt,
      refunded: false,
      refundedAt: null,
      buyerId: buyer.id,
      buyerName: `${buyer.firstName} ${buyer.lastName}`,
    }
  })

  const subtotal = bookings.reduce((sum, booking) => sum + booking.unitPrice * booking.quantity, 0)
  const discountAmount = calculateDiscount(subtotal, coupon)

  const order = {
    id: orderId,
    userId: buyer.id,
    couponCode: coupon?.code ?? null,
    createdAt,
    subtotal,
    discountAmount,
    total: subtotal - discountAmount,
  }

  return { order, bookings }
}

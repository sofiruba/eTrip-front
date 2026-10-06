import { buildOrder } from '../utils/orders'
import { coupons } from './coupons'
import { daysFromToday } from './dates'
import { experiences } from './experiences'
import { sessions } from './sessions'
import { users } from './users'

// Compras de ejemplo: { comprador, sesiones compradas, cupón, hace cuántos días }
const seedPurchases = [
  { userId: 1, items: [{ sessionId: 1, quantity: 2 }], daysAgo: 20 },
  { userId: 1, items: [{ sessionId: 13, quantity: 2 }, { sessionId: 10, quantity: 1 }], couponCode: 'PLANFINDE10', daysAgo: 40 },
  { userId: 1, items: [{ sessionId: 8, quantity: 1 }], daysAgo: 3 },
  { userId: 6, items: [{ sessionId: 5, quantity: 2 }, { sessionId: 1, quantity: 3 }], daysAgo: 10 },
  { userId: 7, items: [{ sessionId: 5, quantity: 1 }], daysAgo: 8 },
  { userId: 8, items: [{ sessionId: 5, quantity: 2 }], daysAgo: 6 },
  { userId: 6, items: [{ sessionId: 7, quantity: 2 }], daysAgo: 45 },
  { userId: 7, items: [{ sessionId: 7, quantity: 2 }, { sessionId: 4, quantity: 2 }], daysAgo: 50 },
]

function buildSeed() {
  const orders = []
  const bookings = []

  seedPurchases.forEach((purchase, index) => {
    const { order, bookings: orderBookings } = buildOrder({
      orderId: 1040 + index,
      firstBookingId: bookings.length + 1,
      buyer: users.find((user) => user.id === purchase.userId),
      items: purchase.items,
      coupon: coupons.find((coupon) => coupon.code === purchase.couponCode),
      createdAt: daysFromToday(-purchase.daysAgo, '10:30'),
      sessions,
      experiences,
    })
    orders.push(order)
    bookings.push(...orderBookings)
  })

  return { orders, bookings }
}

export const { orders, bookings } = buildSeed()

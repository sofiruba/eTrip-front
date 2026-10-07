import { categories } from './categories'
import { coupons } from './coupons'
import { experiences } from './experiences'
import { bookings, orders } from './orders'
import { reviews } from './reviews'
import { sessions } from './sessions'
import { users } from './users'

/**
 * "Base de datos" inicial en memoria. Cuando se conecte el back,
 * cada colección se reemplaza por la respuesta del endpoint equivalente.
 */
export const initialDatabase = {
  users,
  categories,
  experiences,
  sessions,
  orders,
  bookings,
  reviews,
  coupons,
}

export { demoAccounts } from './users'
export { featuredInterests, interestOptions, MAX_INTERESTS } from './interests'

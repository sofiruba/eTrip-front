import { useEffect, useState } from 'react'
import { CartContext } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import * as cartService from '../services/cartService'

/**
 * Carrito del usuario (vive en el back). Es global porque el navbar muestra la cantidad.
 * Cada acción llama al back y guarda en el estado el carrito que devuelve.
 */
function CartProvider({ children }) {
  const { user, isAdmin } = useAuth()
  const [cart, setCart] = useState(null)
  const userId = user?.id

  // Sin sesión no hay carrito, y los administradores no compran
  const canBuy = Boolean(userId) && !isAdmin

  const loadCart = () =>
    cartService
      .getCart(userId)
      .then((data) => setCart(data))
      .catch((error) => console.error('Error al traer el carrito:', error))

  // Cada vez que cambia el usuario (login / logout) traemos su carrito
  useEffect(() => {
    if (!userId || isAdmin) return
    cartService
      .getCart(userId)
      .then((data) => setCart(data))
      .catch((error) => console.error('Error al traer el carrito:', error))
  }, [userId, isAdmin])

  // Si cerró sesión ignoramos el carrito que había quedado guardado
  const items = canBuy ? (cart?.items ?? []) : []

  const value = {
    items, // [{ id, experienceSessionId, experienceId, experienceTitle, startsAt, quantity, unitPrice, subtotal }]
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    total: canBuy ? Number(cart?.total ?? 0) : 0,
    quantityOf: (sessionId) => items.find((item) => item.experienceSessionId === sessionId)?.quantity ?? 0,

    add: (sessionId, quantity) => cartService.addToCart(sessionId, quantity).then((data) => setCart(data)),

    updateQuantity: (itemId, quantity) =>
      cartService.updateCartItem(userId, itemId, quantity).then((data) => setCart(data)),

    // DELETE no devuelve el carrito: lo volvemos a pedir para tener el total actualizado
    remove: (itemId) => cartService.removeCartItem(userId, itemId).then(loadCart),

    clear: () => cartService.clearCart(userId).then(() => setCart({ ...cart, items: [], total: 0 })),

    reload: loadCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export default CartProvider

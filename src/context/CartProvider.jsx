import { useMemo } from 'react'
import { findById } from '../data/selectors'
import { CartContext } from '../hooks/useCart'
import { usePersistentState } from '../hooks/usePersistentState'
import { useStore } from '../hooks/useStore'

/** El carrito guarda { sessionId, quantity }, igual que CartItemRequestDTO. */
function CartProvider({ children }) {
  const { db, experiences } = useStore()
  const [items, setItems] = usePersistentState('plan:cart', [])

  const value = useMemo(() => {
    const lines = items
      .map((item) => {
        const session = findById(db.sessions, item.sessionId)
        const experience = session && experiences.find((entry) => entry.id === session.experienceId)
        if (!experience) return null
        return { ...item, session, experience, subtotal: experience.finalPrice * item.quantity }
      })
      .filter(Boolean)

    const updateQuantity = (sessionId, quantity) =>
      setItems((current) => current.map((item) => (item.sessionId === sessionId ? { ...item, quantity } : item)))

    // Si la sesión ya está en el carrito se suma, sin pasarse de los cupos disponibles
    const add = (sessionId, quantity = 1) => {
      const seats = findById(db.sessions, sessionId)?.availableSeats ?? quantity
      setItems((current) =>
        current.some((item) => item.sessionId === sessionId)
          ? current.map((item) =>
              item.sessionId === sessionId ? { ...item, quantity: Math.min(item.quantity + quantity, seats) } : item,
            )
          : [...current, { sessionId, quantity: Math.min(quantity, seats) }],
      )
    }

    return {
      lines,
      // Sesiones del carrito que ya no existen (el anfitrión las borró)
      missingCount: items.length - lines.length,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      savings: lines.reduce((sum, line) => sum + (line.experience.price - line.experience.finalPrice) * line.quantity, 0),
      total: lines.reduce((sum, line) => sum + line.subtotal, 0),
      add,
      updateQuantity,
      remove: (sessionId) => setItems((current) => current.filter((item) => item.sessionId !== sessionId)),
      clear: () => setItems([]),
    }
  }, [items, db.sessions, experiences, setItems])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export default CartProvider

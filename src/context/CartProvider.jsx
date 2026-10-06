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

    const add = (sessionId, quantity = 1) =>
      setItems((current) =>
        current.some((item) => item.sessionId === sessionId)
          ? current.map((item) => (item.sessionId === sessionId ? { ...item, quantity } : item))
          : [...current, { sessionId, quantity }],
      )

    return {
      lines,
      count: lines.length,
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

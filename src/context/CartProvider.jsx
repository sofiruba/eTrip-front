import { useCallback, useEffect, useMemo, useState } from 'react'
import { CartContext } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import { useStore } from '../hooks/useStore'
import { apiFetch } from '../services/api'

function CartProvider({ children }) {
  const { user } = useAuth()
  const { experiences, db } = useStore()
  const [cart, setCart] = useState(null)

  const loadCart = useCallback(async () => {
    if (!user) {
      setCart(null)
      return
    }
    try {
      setCart(await apiFetch(`/carts/user/${user.id}`))
    } catch {
      setCart(null)
    }
  }, [user])

  useEffect(() => {
    loadCart()
  }, [loadCart])

  const lines = (cart?.items ?? []).map((item) => {
    const experience = experiences.find((entry) => entry.id === item.experienceId)
    const session = db.sessions.find((entry) => entry.id === item.experienceSessionId)
    return {
      ...item,
      sessionId: item.experienceSessionId,
      experience,
      session,
      subtotal: Number(item.subtotal ?? 0),
    }
  }).filter((line) => line.experience && line.session)

  const mutate = async (request) => {
    const next = await request()
    if (next) setCart(next)
    else await loadCart()
  }

  const value = useMemo(() => ({
    lines,
    missingCount: (cart?.items?.length ?? 0) - lines.length,
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    savings: lines.reduce((sum, line) => sum + ((line.experience.price - line.experience.finalPrice) * line.quantity), 0),
    total: Number(cart?.total ?? lines.reduce((sum, line) => sum + line.subtotal, 0)),
    add: (sessionId, quantity = 1) => {
      if (!user) return false
      return mutate(() => apiFetch('/carts/items', {
        method: 'POST',
        body: JSON.stringify({ experienceSessionId: sessionId, quantity }),
      }))
    },
    updateQuantity: (sessionId, quantity) => {
      const item = cart?.items?.find((entry) => entry.experienceSessionId === sessionId)
      if (!item || !user) return false
      return mutate(() => apiFetch(`/carts/user/${user.id}/items/${item.id}?quantity=${quantity}`, { method: 'PATCH' }))
    },
    remove: (sessionId) => {
      const item = cart?.items?.find((entry) => entry.experienceSessionId === sessionId)
      if (!item || !user) return false
      return mutate(() => apiFetch(`/carts/user/${user.id}/items/${item.id}`, { method: 'DELETE' }))
    },
    clear: () => user ? mutate(() => apiFetch(`/carts/user/${user.id}`, { method: 'DELETE' })) : false,
  }), [cart, lines, user, loadCart])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export default CartProvider

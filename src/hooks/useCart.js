import { createContext, useContext } from 'react'

export const CartContext = createContext(null)

/** { lines, total, count, add, updateQuantity, remove, clear } */
export function useCart() {
  return useContext(CartContext)
}

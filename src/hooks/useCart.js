import { createContext, useContext } from 'react'

export const CartContext = createContext(null)

/** { items, count, total, quantityOf, add, updateQuantity, remove, clear, reload } */
export function useCart() {
  return useContext(CartContext)
}

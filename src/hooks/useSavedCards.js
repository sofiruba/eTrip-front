import { createContext, useContext } from 'react'

export const SavedCardsContext = createContext(null)

/** { cards, saveCard, removeCard } del usuario logueado. */
export function useSavedCards() {
  return useContext(SavedCardsContext)
}

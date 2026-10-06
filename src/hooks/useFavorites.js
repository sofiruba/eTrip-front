import { createContext, useContext } from 'react'

export const FavoritesContext = createContext(null)

/** { favoriteIds, isFavorite, toggleFavorite } */
export function useFavorites() {
  return useContext(FavoritesContext)
}

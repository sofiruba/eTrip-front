import { createContext, useContext } from 'react'

export const FavoritesContext = createContext(null)

/** { favoriteIds, isFavorite, toggleFavorite, saveAfterLogin } (favoritos del usuario logueado) */
export function useFavorites() {
  return useContext(FavoritesContext)
}

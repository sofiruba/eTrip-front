import { useMemo } from 'react'
import { FavoritesContext } from '../hooks/useFavorites'
import { usePersistentState } from '../hooks/usePersistentState'

function FavoritesProvider({ children }) {
  const [favoriteIds, setFavoriteIds] = usePersistentState('plan:favorites', [])

  const value = useMemo(
    () => ({
      favoriteIds,
      isFavorite: (id) => favoriteIds.includes(id),
      toggleFavorite: (id) =>
        setFavoriteIds((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id])),
    }),
    [favoriteIds, setFavoriteIds],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export default FavoritesProvider

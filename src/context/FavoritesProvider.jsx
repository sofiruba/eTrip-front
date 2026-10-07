import { useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { FavoritesContext } from '../hooks/useFavorites'
import { usePersistentState } from '../hooks/usePersistentState'

/**
 * Favoritos de cada usuario ({ [userId]: [experienceId] } en localStorage; el back no los tiene).
 * Sin sesión no se guarda nada: se recuerda cuál quiso guardar y se agrega apenas ingresa.
 */
function FavoritesProvider({ children }) {
  const { user, authMode } = useAuth()
  const [byUser, setByUser] = usePersistentState('plan:favoritesByUser', {})
  const [pendingId, setPendingId] = useState(null)

  // Si cerró el login sin ingresar, se olvida lo pendiente
  if (!user && !authMode && pendingId !== null) setPendingId(null)

  // Si alguien tocó el corazón sin sesión, al ingresar se guarda esa experiencia
  if (user && pendingId !== null) {
    setPendingId(null)
    setByUser((current) => {
      const ids = current[user.id] ?? []
      return ids.includes(pendingId) ? current : { ...current, [user.id]: [...ids, pendingId] }
    })
  }

  const value = useMemo(() => {
    const favoriteIds = user ? (byUser[user.id] ?? []) : []
    return {
      favoriteIds,
      isFavorite: (id) => favoriteIds.includes(id),
      toggleFavorite: (id) =>
        setByUser((current) => {
          const ids = current[user.id] ?? []
          return { ...current, [user.id]: ids.includes(id) ? ids.filter((entry) => entry !== id) : [...ids, id] }
        }),
      // Para invitados: se guarda después del login
      saveAfterLogin: setPendingId,
    }
  }, [user, byUser, setByUser])

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export default FavoritesProvider

import { useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { usePersistentState } from '../hooks/usePersistentState'
import { SavedCardsContext } from '../hooks/useSavedCards'

/**
 * Tarjetas guardadas por usuario ({ [userId]: SavedCard[] }).
 * Solo se guardan marca, últimos 4, vencimiento y titular (ver toSavedCard).
 */
function SavedCardsProvider({ children }) {
  const { user } = useAuth()
  const [cardsByUser, setCardsByUser] = usePersistentState('plan:savedCards', {})

  const value = useMemo(() => {
    const cards = (user && cardsByUser[user.id]) || []
    const setCards = (updater) => setCardsByUser((current) => ({ ...current, [user.id]: updater(current[user.id] || []) }))

    return {
      cards,
      // Si ya estaba guardada, la actualiza y la pone primera.
      saveCard: (card) => setCards((current) => [card, ...current.filter((entry) => entry.id !== card.id)]),
      removeCard: (id) => setCards((current) => current.filter((entry) => entry.id !== id)),
    }
  }, [user, cardsByUser, setCardsByUser])

  return <SavedCardsContext.Provider value={value}>{children}</SavedCardsContext.Provider>
}

export default SavedCardsProvider

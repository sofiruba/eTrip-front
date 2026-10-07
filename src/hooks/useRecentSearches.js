import { usePersistentState } from './usePersistentState'

const MAX_RECENT = 4

/** Últimas búsquedas del buscador principal ({ location, dateFrom, dateTo, adults, children, infants }), en este navegador. */
export function useRecentSearches() {
  const [recent, setRecent] = usePersistentState('plan:recentSearches', [])

  const add = (search) => {
    if (!search.location) return
    setRecent((current) =>
      [search, ...current.filter((entry) => entry.location.toLowerCase() !== search.location.toLowerCase())].slice(0, MAX_RECENT),
    )
  }

  return { recent, add }
}

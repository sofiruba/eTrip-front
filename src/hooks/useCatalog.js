import { createContext, useContext } from 'react'

export const CatalogContext = createContext(null)

/**
 * Catálogo público que se trae una sola vez al abrir la app (ver CatalogProvider):
 * { experiences, sessions, categories, loading, error, reload, refreshSessions }.
 * Cada experiencia ya viene con su próxima fecha y los lugares que quedan.
 */
export function useCatalog() {
  return useContext(CatalogContext)
}

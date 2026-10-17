import { useEffect, useState } from 'react'
import { useCatalog } from './useCatalog'

/**
 * Al montar la página vuelve a pedir las fechas del catálogo, para mostrar los lugares que quedan ahora
 * (el catálogo se cargó al abrir la app y alguien pudo haber comprado mientras tanto).
 * Devuelve true cuando ya llegaron.
 */
export function useFreshSessions() {
  const { refreshSessions } = useCatalog()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    refreshSessions().then(() => {
      if (active) setReady(true)
    })
    // Si se sale de la página antes de que responda, no se actualiza un componente que ya no está
    return () => {
      active = false
    }
  }, [refreshSessions])

  return ready
}

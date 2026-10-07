import { useEffect, useRef } from 'react'
import { useBlocker } from 'react-router-dom'

/**
 * Avisa antes de salir de un formulario con cambios sin guardar:
 * bloquea la navegación interna (devuelve el blocker para mostrar un diálogo)
 * y pide confirmación del navegador al cerrar o recargar la pestaña.
 * `allowLeave()` desactiva el aviso, por ejemplo justo antes de navegar después de guardar.
 */
export function useUnsavedChanges(dirty) {
  const bypass = useRef(false)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && !bypass.current && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (!dirty) return undefined
    const warn = (event) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  return {
    blocker,
    allowLeave: () => {
      bypass.current = true
    },
  }
}

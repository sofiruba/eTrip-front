import { useEffect, useState } from 'react'

/** useState que se guarda en localStorage (si está disponible). */
export function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      // Sin almacenamiento (modo privado) o lleno (QuotaExceededError): seguimos solo en memoria,
      // pero lo dejamos anotado para que no se pierdan datos sin ninguna pista.
      console.warn(`No se pudo guardar "${key}" en este navegador:`, error)
    }
  }, [key, value])

  return [value, setValue]
}

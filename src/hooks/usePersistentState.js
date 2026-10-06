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
    } catch {
      // Sin almacenamiento (modo privado, etc.): seguimos solo en memoria.
    }
  }, [key, value])

  return [value, setValue]
}

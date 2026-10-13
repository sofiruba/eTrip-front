import { useEffect, useState } from 'react'

/**
 * true cuando el elemento con ese id queda fuera de pantalla.
 * `watchKey` vuelve a engancharse cuando cambia (por ejemplo, cuando el elemento recién aparece).
 */
export function useElementOffscreen(id, watchKey) {
  const [offscreen, setOffscreen] = useState(false)

  useEffect(() => {
    const element = document.getElementById(id)
    if (!element || !('IntersectionObserver' in window)) return undefined
    const observer = new IntersectionObserver(([entry]) => setOffscreen(!entry.isIntersecting))
    observer.observe(element)
    return () => observer.disconnect()
  }, [id, watchKey])

  return offscreen
}

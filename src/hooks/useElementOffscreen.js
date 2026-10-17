import { useEffect, useState } from 'react'

/**
 * true cuando el elemento de la ref (`useRef` que se le pasa con `ref={...}`) queda fuera de pantalla.
 * `watchKey` vuelve a engancharse cuando cambia (por ejemplo, cuando el elemento recién aparece).
 */
export function useElementOffscreen(ref, watchKey) {
  const [offscreen, setOffscreen] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element || !('IntersectionObserver' in window)) return undefined
    const observer = new IntersectionObserver(([entry]) => setOffscreen(!entry.isIntersecting))
    observer.observe(element)
    // Desmontaje: se deja de observar
    return () => observer.disconnect()
  }, [ref, watchKey])

  return offscreen
}

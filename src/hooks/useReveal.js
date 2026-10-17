import { useEffect, useRef } from 'react'

/**
 * Animación de entrada al hacer scroll: los elementos con `data-reveal` adentro del contenedor
 * aparecen (clase `is-revealed`) la primera vez que entran en pantalla. Los estilos están en base.css.
 * Devuelve el ref para el contenedor.
 */
export function useReveal() {
  const ref = useRef(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return undefined
    const items = container.querySelectorAll('[data-reveal]')
    const show = (element) => element.classList.add('is-revealed')

    if (!('IntersectionObserver' in window)) {
      items.forEach(show)
      return undefined
    }

    container.classList.add('reveal-ready')
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          show(entry.target)
          observer.unobserve(entry.target)
        }),
      { rootMargin: '0px 0px -10% 0px' },
    )
    items.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [])

  return ref
}

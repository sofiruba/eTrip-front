import { useEffect, useRef } from 'react'

const openModals = []

/**
 * Bloquea el scroll del body y cierra con Escape mientras el modal está abierto.
 * Con modales apilados, Escape cierra solo el de más arriba.
 */
export function useModalBehavior(onClose) {
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const token = {}
    openModals.push(token)
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && openModals.at(-1) === token) onCloseRef.current()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      openModals.splice(openModals.indexOf(token), 1)
      if (!openModals.length) document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])
}

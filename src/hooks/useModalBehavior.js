import { useEffect, useRef } from 'react'

const openModals = []

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Bloquea el scroll del body y cierra con Escape mientras el modal está abierto.
 * Con modales apilados, Escape cierra solo el de más arriba.
 * Si se pasa `panelRef`, además encierra el foco (Tab) dentro del modal y, al cerrarse,
 * lo devuelve al elemento que lo abrió.
 */
export function useModalBehavior(onClose, panelRef) {
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const token = {}
    const opener = document.activeElement
    openModals.push(token)
    document.body.style.overflow = 'hidden'

    const trapFocus = (event) => {
      const panel = panelRef?.current
      if (!panel) return
      const focusable = [...panel.querySelectorAll(FOCUSABLE)].filter((element) => element.offsetParent !== null)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable.at(-1)
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    const handleKeyDown = (event) => {
      if (openModals.at(-1) !== token) return
      if (event.key === 'Escape') onCloseRef.current()
      if (event.key === 'Tab') trapFocus(event)
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      openModals.splice(openModals.indexOf(token), 1)
      if (!openModals.length) document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
      if (panelRef && opener instanceof HTMLElement && opener.isConnected) opener.focus()
    }
  }, [panelRef])
}

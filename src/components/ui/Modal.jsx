import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useModalBehavior } from '../../hooks/useModalBehavior'
import IconButton from './IconButton'
import './Modal.css'

/**
 * Modal accesible (Esc, foco, scroll bloqueado).
 * variant="drawer" lo muestra como panel lateral.
 */
function Modal({ title, description, onClose, footer, size = 'md', variant = 'dialog', children }) {
  const titleId = useId()
  const panelRef = useRef(null)
  useModalBehavior(onClose, panelRef)

  useEffect(() => {
    panelRef.current?.focus()
  }, [])

  return createPortal(
    <div
      className={`modal-backdrop modal-backdrop--${variant}`}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        ref={panelRef}
        className={`modal modal--${variant} modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="modal__header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description && <p className="muted small">{description}</p>}
          </div>
          <IconButton icon={X} label="Cerrar" variant="ghost" onClick={onClose} />
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </section>
    </div>,
    document.body,
  )
}

export default Modal

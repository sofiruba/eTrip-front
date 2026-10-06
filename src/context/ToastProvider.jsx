import { useCallback, useEffect, useRef, useState } from 'react'
import { CircleAlert, CircleCheck, Info } from 'lucide-react'
import { ToastContext } from '../hooks/useToast'
import './Toast.css'

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info }
const DURATION = 3200

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef([])

  const notify = useCallback((message, tone = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current.slice(-2), { id, message, tone }])
    timers.current.push(window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), DURATION))
  }, [])

  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toast-region" aria-live="polite">
        {toasts.map(({ id, message, tone }) => {
          const Icon = ICONS[tone]
          return (
            <div className={`toast toast--${tone}`} key={id} role="status">
              <Icon size={18} aria-hidden />
              {message}
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export default ToastProvider

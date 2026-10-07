import { useCallback, useEffect, useRef, useState } from 'react'
import { CircleAlert, CircleCheck, Heart, HeartOff, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ToastContext } from '../hooks/useToast'
import './Toast.css'

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info, favorite: Heart, unfavorite: HeartOff }
const DURATION = 3200

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef([])

  const notify = useCallback((message, tone = 'success', action = null) => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current.slice(-2), { id, message, tone, action }])
    timers.current.push(window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), DURATION))
  }, [])

  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toast-region" aria-live="polite">
        {toasts.map(({ id, message, tone, action }) => {
          const Icon = ICONS[tone]
          return (
            <div className={`toast toast--${tone}`} key={id} role="status">
              <Icon size={18} aria-hidden />
              <span className="toast__message">{message}</span>
              {action && (
                <Link to={action.to} className="toast__action">
                  {action.label}
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export default ToastProvider

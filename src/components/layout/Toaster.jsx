import { useEffect } from 'react'
import { CircleAlert, CircleCheck, Info } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { hideToast } from '../../redux/toastsSlice'
import './Toaster.css'

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info }
const DURATION = 3200

/** Un aviso. Se saca solo a los pocos segundos (efecto secundario; la limpieza cancela el timer si se desmonta antes). */
function Toast({ id, message, tone, link }) {
  const dispatch = useDispatch()
  const Icon = ICONS[tone]

  useEffect(() => {
    const timer = window.setTimeout(() => dispatch(hideToast(id)), DURATION)
    return () => window.clearTimeout(timer)
  }, [id, dispatch])

  return (
    <div className={`toast toast--${tone}`} role="status">
      <Icon size={18} aria-hidden />
      <span className="toast__message">{message}</span>
      {link && (
        <Link to={link.to} className="toast__action">
          {link.label}
        </Link>
      )}
    </div>
  )
}

/** Los avisos de toda la app: están en el estado global (slice toasts). Cualquier componente los muestra con dispatch(showToast({ message: ... })). */
function Toaster() {
  const toasts = useSelector((state) => state.toasts.items)

  return (
    <div className="toast-region" aria-live="polite">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  )
}

export default Toaster

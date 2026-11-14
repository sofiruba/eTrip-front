import { useState } from 'react'
import { Bell, Check } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchNotifications, markNotificationRead } from '../../redux/notificationsSlice'
import { formatRelativeDate } from '../../utils/format'
import IconButton from '../ui/IconButton'
import './NotificationBell.css'

/** Los avisos se piden al iniciar sesión (App.jsx) y quedan en el estado global. */
function NotificationBell() {
  const dispatch = useDispatch()
  const notifications = useSelector((state) => state.notifications.items)
  const [open, setOpen] = useState(false)
  const unread = notifications.filter((notification) => !notification.read)

  // Al abrir el panel se vuelven a pedir: los avisos los generan otros usuarios, así aparecen los que llegaron mientras tanto
  const toggle = () => {
    if (!open) dispatch(fetchNotifications())
    setOpen(!open)
  }

  return (
    <div className="notification-bell">
      <IconButton
        icon={Bell}
        label={`Notificaciones${unread.length ? `, ${unread.length} sin leer` : ''}`}
        variant="ghost"
        onClick={toggle}
      />
      {unread.length > 0 && <span className="notification-bell__count">{unread.length > 9 ? '9+' : unread.length}</span>}
      {open && (
        <div className="notification-bell__panel">
          <div className="notification-bell__header">
            <strong>Notificaciones</strong>
            {unread.length > 0 && <small>{unread.length} sin leer</small>}
          </div>
          {notifications.length ? (
            <ul>
              {notifications.slice(0, 8).map((notification) => (
                <li key={notification.id} className={notification.read ? '' : 'is-unread'}>
                  {/* PATCH: el reducer reemplaza la notificación por la que devuelve el back (ya leída) */}
                  <button type="button" onClick={() => !notification.read && dispatch(markNotificationRead(notification.id))}>
                    <strong>{notification.title}</strong>
                    <span>{notification.message}</span>
                    <small>{formatRelativeDate(notification.createdAt)}</small>
                    {!notification.read && <Check size={14} aria-label="Marcar como leída" />}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="notification-bell__empty">No tenés notificaciones nuevas.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell

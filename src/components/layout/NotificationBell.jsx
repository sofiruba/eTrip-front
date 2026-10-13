import { useEffect, useState } from 'react'
import { Bell, Check } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getNotifications, markNotificationRead } from '../../services/notificationsService'
import { formatRelativeDate } from '../../utils/format'
import IconButton from '../ui/IconButton'
import './NotificationBell.css'

function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const unread = notifications.filter((notification) => !notification.read)

  // Se piden cuando hay un usuario (y de nuevo si cambia de cuenta)
  const userId = user?.id
  useEffect(() => {
    if (!userId) return
    getNotifications()
      .then((data) => setNotifications(data))
      .catch((error) => console.error('Error al traer las notificaciones:', error))
  }, [userId])

  // PATCH y reemplazamos la notificación por la que devuelve el back (ya leída)
  const markRead = (notification) =>
    markNotificationRead(notification.id)
      .then((updated) => setNotifications(notifications.map((item) => (item.id === updated.id ? updated : item))))
      .catch((error) => console.error('Error al marcar la notificación:', error))

  return (
    <div className="notification-bell">
      <IconButton
        icon={Bell}
        label={`Notificaciones${unread.length ? `, ${unread.length} sin leer` : ''}`}
        variant="ghost"
        onClick={() => setOpen((value) => !value)}
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
                  <button type="button" onClick={() => !notification.read && markRead(notification)}>
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

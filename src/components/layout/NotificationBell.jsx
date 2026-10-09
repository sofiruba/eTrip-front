import { useState } from 'react'
import { Bell, Check } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import { formatRelativeDate } from '../../utils/format'
import IconButton from '../ui/IconButton'
import './NotificationBell.css'

function NotificationBell() {
  const { db, markNotificationRead } = useStore()
  const [open, setOpen] = useState(false)
  const unread = db.notifications.filter((notification) => !notification.read)

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
          {db.notifications.length ? (
            <ul>
              {db.notifications.slice(0, 8).map((notification) => (
                <li key={notification.id} className={notification.read ? '' : 'is-unread'}>
                  <button type="button" onClick={() => !notification.read && markNotificationRead(notification.id)}>
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

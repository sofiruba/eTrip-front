import { useEffect, useRef, useState } from 'react'
import { CalendarCheck, ChevronDown, LayoutDashboard, LogOut, Store, User } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../../redux/authSlice'
import { showToast } from '../../redux/toastsSlice'
import Avatar from '../ui/Avatar'
import { fullName } from '../../utils/format'
import './UserMenu.css'

function UserMenu() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const isAdmin = useSelector((state) => state.auth.user?.role === 'ADMIN')
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [openedAt, setOpenedAt] = useState(pathname)
  const menuRef = useRef(null)

  // Cerrar al navegar a otra página
  if (open && openedAt !== pathname) setOpen(false)

  useEffect(() => {
    if (!open) return undefined
    const close = (event) => {
      if (event.type === 'keydown' ? event.key === 'Escape' : !menuRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  // La cuenta admin no compra ni publica: solo ve el panel
  const links = isAdmin
    ? [{ to: '/admin', label: 'Panel de administración', icon: LayoutDashboard }]
    : [
        { to: '/perfil', label: 'Mi perfil', icon: User },
        { to: '/mis-reservas', label: 'Mis reservas', icon: CalendarCheck },
        { to: '/anfitrion', label: 'Modo anfitrión', icon: Store },
      ]

  const handleLogout = () => {
    setOpen(false)
    // Cada slice con datos de la cuenta (carrito, reservas, panel…) vuelve a su estado inicial al escuchar esta acción
    dispatch(logout())
    navigate('/')
    dispatch(showToast({ message: 'Cerraste sesión. ¡Hasta pronto!', tone: 'info' }))
  }

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        type="button"
        className="user-menu__trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => {
          setOpen(!open)
          setOpenedAt(pathname)
        }}
      >
        <Avatar name={fullName(user)} src={user.avatarUrl} size="sm" />
        <span className="user-menu__name">{user.firstName}</span>
        <ChevronDown size={16} aria-hidden />
      </button>

      {open && (
        <div className="user-menu__panel" role="menu">
          <div className="user-menu__header">
            <strong>{fullName(user)}</strong>
            <small>{user.email}</small>
          </div>
          {links.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} role="menuitem" className="user-menu__item">
              <Icon size={18} aria-hidden />
              {label}
            </Link>
          ))}
          <hr className="divider" />
          <button type="button" role="menuitem" className="user-menu__item" onClick={handleLogout}>
            <LogOut size={18} aria-hidden />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}

export default UserMenu

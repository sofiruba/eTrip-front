import { useEffect, useState } from 'react'
import { Menu, Moon, ShoppingBag, Sun, X } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'
import { openAuth, selectIsAdmin, selectUser } from '../../redux/authSlice'
import { selectCartCount } from '../../redux/cartSlice'
import Button from '../ui/Button'
import IconButton from '../ui/IconButton'
import NavbarSearch from '../search/NavbarSearch'
import Logo from './Logo'
import UserMenu from './UserMenu'
import NotificationBell from './NotificationBell'
import './Navbar.css'

function Navbar() {
  const dispatch = useDispatch()
  const user = useSelector(selectUser)
  const isAdmin = useSelector(selectIsAdmin)
  const count = useSelector(selectCartCount)
  const { pathname } = useLocation()
  const theme = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openedAt, setOpenedAt] = useState(pathname)

  if (mobileOpen && openedAt !== pathname) setMobileOpen(false)

  // En la home la píldora se esconde mientras el buscador grande está a la vista.
  // El buscador grande es de otra rama del árbol (HomePage, no el layout), por eso se busca por id y no con una ref.
  const [heroSearchVisible, setHeroSearchVisible] = useState(pathname === '/')
  useEffect(() => {
    const heroSearch = document.getElementById('hero-search')
    if (!heroSearch || !('IntersectionObserver' in window)) return undefined
    const observer = new IntersectionObserver(([entry]) => setHeroSearchVisible(entry.isIntersecting), {
      rootMargin: '-72px 0px 0px 0px',
    })
    observer.observe(heroSearch)
    return () => observer.disconnect()
  }, [pathname])

  const links = isAdmin
    ? [
        { to: '/admin', label: 'Panel' },
        { to: '/', label: 'Ver sitio' },
      ]
    : [
        { to: '/', label: 'Explorar' },
        ...(user ? [{ to: '/mis-reservas', label: 'Mis reservas' }] : []),
        { to: '/anfitrion', label: user ? 'Modo anfitrión' : 'Ser anfitrión' },
        // Con sesión, "Sobre nosotros" queda solo en el footer: así entra la barra de búsqueda completa
        ...(user ? [] : [{ to: '/nosotros', label: 'Sobre nosotros' }]),
      ]

  const navLinks = links.map(({ to, label }) => (
    <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `navbar__link ${isActive ? 'is-active' : ''}`}>
      {label}
    </NavLink>
  ))

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Logo />
        <div className="navbar__search">
          <NavbarSearch hidden={pathname === '/' && heroSearchVisible} />
        </div>
        <nav className="navbar__links" aria-label="Principal">
          {navLinks}
        </nav>

        <div className="navbar__actions">
          <IconButton
            className="navbar__theme"
            icon={theme.isDark ? Sun : Moon}
            label={theme.isDark ? 'Usar tema claro' : 'Usar tema oscuro'}
            variant="ghost"
            onClick={theme.toggle}
          />
          {!isAdmin && (
            <Link to="/carrito" className="navbar__cart" aria-label={`Carrito, ${count === 1 ? '1 lugar' : `${count} lugares`}`}>
              <ShoppingBag size={22} aria-hidden />
              {count > 0 && <span className="navbar__cart-count">{count}</span>}
            </Link>
          )}
          {user && <NotificationBell />}
          {user ? (
            <UserMenu />
          ) : (
            <Button size="sm" onClick={() => dispatch(openAuth('login'))}>
              Ingresar
            </Button>
          )}
          <IconButton
            className="navbar__toggle"
            icon={mobileOpen ? X : Menu}
            label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            variant="ghost"
            aria-expanded={mobileOpen}
            onClick={() => {
              setMobileOpen(!mobileOpen)
              setOpenedAt(pathname)
            }}
          />
        </div>
      </div>

      {mobileOpen && (
        <div className="navbar__mobile container">
          <nav aria-label="Principal">{navLinks}</nav>
          {/* En el celu el botón de tema no entra en la barra: va acá */}
          <button type="button" className="navbar__link navbar__mobile-theme" onClick={theme.toggle}>
            {theme.isDark ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
            {theme.isDark ? 'Usar tema claro' : 'Usar tema oscuro'}
          </button>
        </div>
      )}
    </header>
  )
}

export default Navbar

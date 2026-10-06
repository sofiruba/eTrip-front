import { useState } from 'react'
import { Menu, ShoppingBag, X } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'
import Button from '../ui/Button'
import IconButton from '../ui/IconButton'
import Logo from './Logo'
import SearchBar from './SearchBar'
import UserMenu from './UserMenu'
import './Navbar.css'

function Navbar() {
  const { user, openAuth } = useAuth()
  const { count } = useCart()
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openedAt, setOpenedAt] = useState(pathname)

  if (mobileOpen && openedAt !== pathname) setMobileOpen(false)

  const links = [
    { to: '/', label: 'Explorar' },
    ...(user ? [{ to: '/mis-reservas', label: 'Mis reservas' }] : []),
    { to: '/anfitrion', label: user ? 'Modo anfitrión' : 'Ser anfitrión' },
    { to: '/nosotros', label: 'Sobre nosotros' },
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
          <SearchBar />
        </div>
        <nav className="navbar__links" aria-label="Principal">
          {navLinks}
        </nav>

        <div className="navbar__actions">
          <Link to="/carrito" className="navbar__cart" aria-label={`Carrito, ${count} sesiones`}>
            <ShoppingBag size={22} aria-hidden />
            {count > 0 && <span className="navbar__cart-count">{count}</span>}
          </Link>
          {user ? (
            <UserMenu />
          ) : (
            <Button size="sm" onClick={() => openAuth('login')}>
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
          <SearchBar onSearch={() => setMobileOpen(false)} />
          <nav aria-label="Principal">{navLinks}</nav>
        </div>
      )}
    </header>
  )
}

export default Navbar

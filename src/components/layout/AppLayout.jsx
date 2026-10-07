import { useEffect } from 'react'
import { LayoutDashboard } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import AuthModal from '../auth/AuthModal'
import { useAuth } from '../../hooks/useAuth'
import ErrorBoundary from './ErrorBoundary'
import Footer from './Footer'
import Navbar from './Navbar'
import './AppLayout.css'

function AppLayout() {
  const { authMode, isAdmin } = useAuth()
  const { pathname, hash } = useLocation()

  // Al cambiar de página se vuelve arriba, salvo que el link apunte a una sección (#ancla)
  useEffect(() => {
    const target = hash && document.getElementById(decodeURIComponent(hash.slice(1)))
    if (target) target.scrollIntoView()
    else window.scrollTo({ top: 0 })
  }, [pathname, hash])

  return (
    <div className="app">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <Navbar />
      {isAdmin && !pathname.startsWith('/admin') && (
        <div className="admin-banner">
          <div className="container admin-banner__inner">
            <span>Estás viendo el sitio como administrador.</span>
            <Link to="/admin">
              <LayoutDashboard size={16} aria-hidden />
              Volver al panel
            </Link>
          </div>
        </div>
      )}
      <main className="app__main" id="contenido" tabIndex={-1}>
        <ErrorBoundary key={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
      {authMode && <AuthModal key={authMode} />}
    </div>
  )
}

export default AppLayout

import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AuthModal from '../auth/AuthModal'
import { useAuth } from '../../hooks/useAuth'
import Footer from './Footer'
import Navbar from './Navbar'
import './AppLayout.css'

function AppLayout() {
  const { authMode } = useAuth()
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="app">
      <Navbar />
      <main className="app__main">
        <Outlet />
      </main>
      <Footer />
      {authMode && <AuthModal key={authMode} />}
    </div>
  )
}

export default AppLayout

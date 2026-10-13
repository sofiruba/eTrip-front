import { Lock, ShieldAlert } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Loading from '../components/ui/Loading'
import { useAuth } from '../hooks/useAuth'

/** Protege rutas: pide iniciar sesión o, si se pasa `role`, verifica el rol. */
function RequireAuth({ role }) {
  const { user, checking, openAuth } = useAuth()

  // Al recargar la página esperamos a saber quién es el usuario antes de decidir
  if (checking) return <Loading />

  if (!user) {
    return (
      <div className="container page page--narrow">
        <EmptyState icon={Lock} title="Ingresá para continuar" text="Necesitás una cuenta para ver esta sección. Es gratis y lleva un minuto.">
          <Button onClick={() => openAuth('login')}>Iniciar sesión</Button>
          <Button variant="secondary" onClick={() => openAuth('register')}>
            Crear cuenta
          </Button>
        </EmptyState>
      </div>
    )
  }

  if (role && user.role !== role) {
    return (
      <div className="container page page--narrow">
        <EmptyState icon={ShieldAlert} title="No tenés acceso" text="Esta sección es solo para administradores de PLAN.">
          <Button to="/">Volver al inicio</Button>
        </EmptyState>
      </div>
    )
  }

  return <Outlet />
}

export default RequireAuth

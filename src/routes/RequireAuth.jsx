import { Lock, ShieldAlert } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet } from 'react-router-dom'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Loading from '../components/ui/Loading'
import { openAuth } from '../redux/authSlice'

/** Protege rutas: pide iniciar sesión o, si se pasa `role`, verifica el rol. */
function RequireAuth({ role }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  // Hay un token guardado pero todavía no sabemos de quién es: esperamos a /users/me antes de decidir
  const checking = useSelector((state) => Boolean(state.auth.token) && !state.auth.user)

  if (checking) return <Loading />

  if (!user) {
    return (
      <div className="container page page--narrow">
        <EmptyState icon={Lock} title="Ingresá para continuar" text="Necesitás una cuenta para ver esta sección. Es gratis y lleva un minuto.">
          <Button onClick={() => dispatch(openAuth('login'))}>Iniciar sesión</Button>
          <Button variant="secondary" onClick={() => dispatch(openAuth('register'))}>
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

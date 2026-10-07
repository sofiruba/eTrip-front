import { LayoutDashboard } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { useAuth } from '../hooks/useAuth'

/**
 * Secciones de cliente (carrito, compras, reservas, perfil, modo anfitrión).
 * La cuenta de administrador solo gestiona desde el panel: acá ve un aviso.
 * Los invitados pasan (las rutas que piden sesión ya están dentro de RequireAuth).
 */
function CustomerOnly() {
  const { isAdmin } = useAuth()

  if (isAdmin) {
    return (
      <div className="container page page--narrow">
        <EmptyState
          icon={LayoutDashboard}
          title="Esta sección es para clientes"
          text="Con la cuenta de administrador no se compra ni se publica. Todo lo del sitio se gestiona desde el panel."
        >
          <Button to="/admin">Ir al panel</Button>
          <Button variant="secondary" to="/">
            Ver el sitio
          </Button>
        </EmptyState>
      </div>
    )
  }

  return <Outlet />
}

export default CustomerOnly

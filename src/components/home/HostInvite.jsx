import { ArrowRight } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import Button from '../ui/Button'
import './HostInvite.css'

/** Invitación a publicar una experiencia. Sin sesión, primero pide registrarse. */
function HostInvite() {
  const { user, openAuth } = useAuth()

  return (
    <section className="section host-invite card">
      <div>
        <span className="eyebrow">Sé anfitrión</span>
        <h2>¿Tenés algo para compartir?</h2>
        <p className="muted">
          Una terraza linda, un oficio, el barrio que conocés de memoria. Cualquiera puede armar un plan en PLAN y recibir a gente
          de su ciudad o de visita.
        </p>
      </div>
      <Button iconRight={ArrowRight} {...(user ? { to: '/anfitrion' } : { onClick: () => openAuth('register', '/anfitrion') })}>
        Publicá tu experiencia
      </Button>
    </section>
  )
}

export default HostInvite

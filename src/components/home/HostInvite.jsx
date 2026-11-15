import { ArrowRight } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { openAuth } from '../../redux/authSlice'
import Button from '../ui/Button'
import './HostInvite.css'

/** Invitación a publicar una experiencia. Sin sesión, primero pide registrarse. */
function HostInvite() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)

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
      <Button iconRight={ArrowRight} {...(user ? { to: '/anfitrion' } : { onClick: () => dispatch(openAuth({ mode: 'register', redirect: '/anfitrion' })) })}>
        Publicá tu experiencia
      </Button>
    </section>
  )
}

export default HostInvite

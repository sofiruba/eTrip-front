import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import Modal from '../ui/Modal'
import ForgotPasswordForm from './ForgotPasswordForm'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import './AuthModal.css'

const FIRST_STEP = { login: null, register: 'account', forgot: 'request' }

const COPY = {
  login: { title: 'Qué bueno verte', description: 'Ingresá para reservar y seguir tus planes.' },
  'register:account': { title: 'Empezá tu próximo plan', description: 'Creá tu cuenta para guardar y reservar experiencias.' },
  'register:profile': { title: 'Contanos de vos', description: 'Así te van a ver anfitriones y otros viajeros.' },
  'register:interests': { title: '¿Qué te gusta hacer?', description: 'Elegí algunos intereses y te mostramos planes para vos.' },
  'forgot:request': { title: 'Recuperá tu contraseña', description: 'Te ayudamos a crear una nueva en un minuto.' },
  'forgot:code': { title: 'Revisá tu email', description: 'Ingresá el código que te mandamos.' },
  'forgot:password': { title: 'Elegí una contraseña nueva', description: 'Es la que vas a usar de ahora en más.' },
}

/** Login, registro y "Olvidé mi contraseña" en un mismo modal. Cada flujo maneja sus pasos. */
function AuthModal() {
  const { authMode, authRedirect, closeAuth } = useAuth()
  const notify = useToast()
  const navigate = useNavigate()
  const [view, setView] = useState({ mode: authMode, step: FIRST_STEP[authMode] })
  // Email o usuario que se comparte entre login y recuperar contraseña (y el email repetido del registro)
  const [identifier, setIdentifier] = useState('')

  const go = (mode, step = FIRST_STEP[mode]) => setView({ mode, step })
  const setStep = (step) => setView({ ...view, step })

  // Cuando el back confirma la sesión: saludamos y llevamos a donde corresponda
  const handleDone = (user, message) => {
    notify(message)
    if (authRedirect) navigate(authRedirect)
    else if (user.role === 'ADMIN') navigate('/admin')
  }

  const copy = COPY[view.step ? `${view.mode}:${view.step}` : view.mode]

  return (
    <Modal title={copy.title} description={copy.description} onClose={closeAuth}>
      <div className="auth-view" key={view.mode}>
        {view.mode === 'login' && (
          <LoginForm
            identifier={identifier}
            onIdentifierChange={setIdentifier}
            onForgot={() => go('forgot')}
            onRegister={() => go('register')}
            onDone={handleDone}
          />
        )}
        {view.mode === 'register' && (
          <RegisterForm
            step={view.step}
            onStepChange={setStep}
            onLogin={(email) => {
              if (email) setIdentifier(email)
              go('login')
            }}
            onDone={handleDone}
          />
        )}
        {view.mode === 'forgot' && (
          <ForgotPasswordForm
            step={view.step}
            onStepChange={setStep}
            identifier={identifier}
            onIdentifierChange={setIdentifier}
            onBack={() => go('login')}
            onDone={handleDone}
          />
        )}
      </div>
    </Modal>
  )
}

export default AuthModal

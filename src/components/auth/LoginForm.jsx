import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import Button from '../ui/Button'
import FormField from '../ui/FormField'
import PasswordField from './PasswordField'

/** Login con email o usuario. `identifier` se comparte con "Olvidé mi contraseña" para no tipearlo dos veces. */
function LoginForm({ identifier, onIdentifierChange, onForgot, onRegister, onDone }) {
  const { login } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    setFormError('')
    if (!identifier.trim()) return setError('Ingresá tu email o nombre de usuario.')

    setSending(true)
    return login(identifier.trim(), password)
      .then((user) => onDone(user, `¡Hola, ${user.firstName}!`))
      .catch((err) => {
        // 401/403 en el login = usuario o contraseña incorrectos
        setFormError([401, 403].includes(err.status) ? 'El email/usuario o la contraseña no son correctos.' : err.message)
        setSending(false)
      })
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <FormField
        label="Email o usuario"
        value={identifier}
        onChange={(event) => {
          onIdentifierChange(event.target.value)
          setError('')
        }}
        error={error}
        autoComplete="username"
        autoFocus
      />
      <div className="auth-password">
        <PasswordField
          label="Contraseña"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
        />
        <button type="button" className="auth-link auth-password__forgot" onClick={onForgot}>
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      {formError && <p className="form-error">{formError}</p>}

      <Button type="submit" full iconRight={ArrowRight} disabled={sending}>
        {sending ? 'Entrando…' : 'Iniciar sesión'}
      </Button>

      <p className="auth-switch">
        ¿No tenés cuenta?{' '}
        <button type="button" className="auth-link" onClick={onRegister}>
          Registrate
        </button>
      </p>
    </form>
  )
}

export default LoginForm

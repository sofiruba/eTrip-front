import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { login } from '../../redux/authSlice'
import Button from '../ui/Button'
import FormField from '../ui/FormField'
import PasswordField from './PasswordField'

/** Login con email o usuario. `identifier` se comparte con "Olvidé mi contraseña" para no tipearlo dos veces. */
function LoginForm({ identifier, onIdentifierChange, onForgot, onRegister, onDone }) {
  const dispatch = useDispatch()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    setFormError('')
    if (!identifier.trim()) return setError('Ingresá tu email o nombre de usuario.')

    setSending(true)
    // El reducer guarda el token y el usuario en el estado global. dispatch devuelve la acción final: fulfilled o rejected
    return dispatch(login({ usernameOrEmail: identifier.trim(), password }))
      .then((action) => {
        // rejected: el back respondió con un error (action.error.message, como en el reducer)
        if (action.error) {
          // El back explica qué pasó: datos incorrectos (401) o cuenta desactivada
          setFormError(action.error.message)
          setSending(false)
          return
        }
        const { user } = action.payload
        return onDone(user, `¡Hola, ${user.firstName}!`)
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

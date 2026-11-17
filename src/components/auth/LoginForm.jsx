import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { login } from '../../redux/authSlice'
import Button from '../ui/Button'
import FormField from '../ui/FormField'
import PasswordField from './PasswordField'

/** Login con email o usuario. `identifier` se comparte con "Olvidé mi contraseña" para no tipearlo dos veces. */
function LoginForm({ identifier, onIdentifierChange, onForgot, onRegister, onVerify, onDone }) {
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
    return dispatch(login({ usernameOrEmail: identifier.trim(), password }))
      .then((action) => {
        if (action.error) {
          setSending(false)
          // 403: la contraseña es correcta pero el email no está verificado. El back ya mandó un código
          if (action.error.code === '403') return onVerify(identifier.trim())
          // El back explica qué pasó: datos incorrectos (401) o cuenta desactivada
          setFormError(action.error.message)
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

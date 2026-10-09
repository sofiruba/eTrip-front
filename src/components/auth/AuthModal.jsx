import { useState } from 'react'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import InterestPicker from '../profile/InterestPicker'
import Button from '../ui/Button'
import FormField from '../ui/FormField'
import Modal from '../ui/Modal'
import './AuthModal.css'

// Mismos nombres que RegisterRequest / AuthenticationRequest del back
const EMPTY_FORM = { username: '', firstname: '', lastname: '', email: '', usernameOrEmail: '', password: '', wantsToHost: false }
const MIN_INTERESTS = 2
const MIN_PASSWORD = 6
const USERNAME_PATTERN = /^[a-z0-9._]{3,20}$/i

const COPY = {
  login: { title: 'Qué bueno verte', description: 'Ingresá para reservar y seguir tus planes.' },
  register: { title: 'Empezá tu próximo plan', description: 'Creá una cuenta para guardar y reservar experiencias.' },
  interests: { title: '¿Qué te gusta hacer?', description: `Elegí al menos ${MIN_INTERESTS} intereses y te mostramos planes para vos.` },
}

function validate(form, isLogin) {
  const errors = {}
  if (isLogin) {
    if (!form.usernameOrEmail.trim()) errors.usernameOrEmail = 'Ingresá tu email o nombre de usuario.'
  } else {
    if (!form.firstname.trim()) errors.firstname = 'Ingresá tu nombre.'
    if (!form.lastname.trim()) errors.lastname = 'Ingresá tu apellido.'
    if (!USERNAME_PATTERN.test(form.username)) errors.username = 'Entre 3 y 20 caracteres: letras, números, punto o guion bajo.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Ingresá un email válido.'
  }
  if (!isLogin && form.password.length < MIN_PASSWORD) {
    errors.password = `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`
  }
  return errors
}

function AuthModal() {
  const { authMode, authRedirect, login, register, closeAuth } = useAuth()
  const notify = useToast()
  const navigate = useNavigate()
  const [mode, setMode] = useState(authMode)
  const [form, setForm] = useState(EMPTY_FORM)
  const [interests, setInterests] = useState([])
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const isLogin = mode === 'login'
  const setField = (field) => (event) => {
    setForm({ ...form, [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value })
    if (errors[field]) setErrors({ ...errors, [field]: undefined })
  }

  const switchMode = (next) => {
    setMode(next)
    setErrors({})
    setFormError('')
  }

  const finish = async (resultPromise) => {
    const result = await resultPromise
    if (result.error) return setFormError(result.error)
    notify(`¡Hola, ${result.user.firstName}!`)
    if (authRedirect) navigate(authRedirect)
    else if (form.wantsToHost) navigate('/anfitrion')
    else if (result.user.role === 'ADMIN') navigate('/admin')
    return undefined
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (mode === 'interests') {
      if (interests.length < MIN_INTERESTS) return setFormError(`Elegí al menos ${MIN_INTERESTS} intereses.`)
      return finish(register({ ...form, interests }))
    }
    const nextErrors = validate(form, isLogin)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return undefined
    return isLogin ? finish(login(form)) : switchMode('interests')
  }

  return (
    <Modal title={COPY[mode].title} description={COPY[mode].description} onClose={closeAuth}>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {mode === 'login' && (
          <p className="auth-divider">Ingresá con la cuenta que registraste en el sistema.</p>
        )}

        {mode !== 'interests' && (
          <>
            {isLogin && <p className="auth-divider">o ingresá con tu cuenta</p>}
            {isLogin ? (
              <FormField
                label="Email o usuario"
                value={form.usernameOrEmail}
                onChange={setField('usernameOrEmail')}
                error={errors.usernameOrEmail}
                autoComplete="username"
              />
            ) : (
              <>
                <div className="form-grid">
                  <FormField label="Nombre" value={form.firstname} onChange={setField('firstname')} error={errors.firstname} autoComplete="given-name" />
                  <FormField label="Apellido" value={form.lastname} onChange={setField('lastname')} error={errors.lastname} autoComplete="family-name" />
                </div>
                <FormField
                  label="Nombre de usuario"
                  value={form.username}
                  onChange={setField('username')}
                  error={errors.username}
                  hint="Así te van a ver otros usuarios. Letras, números, punto o guion bajo."
                  autoComplete="username"
                />
                <FormField label="Email" type="email" value={form.email} onChange={setField('email')} error={errors.email} autoComplete="email" />
              </>
            )}
            <FormField
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={setField('password')}
              error={errors.password}
              hint={!isLogin ? `Mínimo ${MIN_PASSWORD} caracteres.` : undefined}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              addon={
                <button
                  type="button"
                  className="field__addon"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
                </button>
              }
            />
            {!isLogin && (
              <label className="checkbox auth-host">
                <input type="checkbox" checked={form.wantsToHost} onChange={setField('wantsToHost')} />
                También quiero publicar mis propias experiencias
              </label>
            )}
          </>
        )}

        {mode === 'interests' && <InterestPicker value={interests} onChange={setInterests} />}

        {formError && <p className="form-error">{formError}</p>}

        <Button type="submit" full iconRight={ArrowRight}>
          {{ login: 'Iniciar sesión', register: 'Continuar', interests: 'Crear mi cuenta' }[mode]}
        </Button>

        <p className="auth-switch">
          {isLogin ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
          <button type="button" onClick={() => switchMode(isLogin ? 'register' : 'login')}>
            {isLogin ? 'Registrate' : 'Iniciá sesión'}
          </button>
        </p>
      </form>
    </Modal>
  )
}

export default AuthModal

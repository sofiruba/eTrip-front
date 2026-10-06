import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { demoAccounts } from '../../data'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import InterestPicker from '../profile/InterestPicker'
import Button from '../ui/Button'
import FormField from '../ui/FormField'
import Modal from '../ui/Modal'
import './AuthModal.css'

const EMPTY_FORM = { firstName: '', lastName: '', email: '', password: '' }
const MIN_INTERESTS = 2

const COPY = {
  login: { title: 'Qué bueno verte', description: 'Ingresá para reservar y seguir tus planes.' },
  register: { title: 'Empezá tu próximo plan', description: 'Creá una cuenta para guardar y reservar experiencias.' },
  interests: { title: '¿Qué te gusta hacer?', description: `Elegí al menos ${MIN_INTERESTS} intereses y te mostramos planes para vos.` },
}

function validate(form, isLogin) {
  const errors = {}
  if (!isLogin && !form.firstName.trim()) errors.firstName = 'Ingresá tu nombre.'
  if (!isLogin && !form.lastName.trim()) errors.lastName = 'Ingresá tu apellido.'
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Ingresá un email válido.'
  if (form.password.length < 6) errors.password = 'La contraseña debe tener al menos 6 caracteres.'
  return errors
}

function AuthModal() {
  const { authMode, login, register, closeAuth } = useAuth()
  const notify = useToast()
  const navigate = useNavigate()
  const [mode, setMode] = useState(authMode)
  const [form, setForm] = useState(EMPTY_FORM)
  const [interests, setInterests] = useState([])
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')

  const isLogin = mode === 'login'
  const setField = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  const switchMode = (next) => {
    setMode(next)
    setErrors({})
    setFormError('')
  }

  const finish = (result) => {
    if (result.error) return setFormError(result.error)
    notify(`¡Hola, ${result.user.firstName}!`)
    if (result.user.role === 'ADMIN') navigate('/admin')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (mode === 'interests') {
      if (interests.length < MIN_INTERESTS) return setFormError(`Elegí al menos ${MIN_INTERESTS} intereses.`)
      return finish(register({ ...form, interests }))
    }
    const nextErrors = validate(form, isLogin)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return undefined
    return isLogin ? finish(login(form.email)) : switchMode('interests')
  }

  return (
    <Modal title={COPY[mode].title} description={COPY[mode].description} onClose={closeAuth}>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {mode === 'login' && (
          <div className="auth-demo">
            {demoAccounts.map((account) => (
              <button type="button" key={account.email} onClick={() => finish(login(account.email))}>
                <strong>{account.label}</strong>
                <small>{account.email}</small>
              </button>
            ))}
          </div>
        )}

        {mode !== 'interests' && (
          <>
            {isLogin && <p className="auth-divider">o ingresá con tu email</p>}
            {!isLogin && (
              <div className="form-grid">
                <FormField label="Nombre" value={form.firstName} onChange={setField('firstName')} error={errors.firstName} autoComplete="given-name" />
                <FormField label="Apellido" value={form.lastName} onChange={setField('lastName')} error={errors.lastName} autoComplete="family-name" />
              </div>
            )}
            <FormField label="Email" type="email" value={form.email} onChange={setField('email')} error={errors.email} autoComplete="email" />
            <FormField
              label="Contraseña"
              type="password"
              value={form.password}
              onChange={setField('password')}
              error={errors.password}
              hint={isLogin ? 'En la demo cualquier contraseña de 6+ caracteres sirve.' : undefined}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
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

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, CircleCheck, CircleX, LoaderCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { checkAvailability } from '../../services/authService'
import { normalizeText } from '../../utils/format'
import InterestPicker from '../profile/InterestPicker'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import Chip from '../ui/Chip'
import FormField from '../ui/FormField'
import PasswordField, { MIN_PASSWORD } from './PasswordField'

const REGISTER_STEPS = [
  { id: 'account', label: 'Tu cuenta' },
  { id: 'profile', label: 'Sobre vos' },
  { id: 'interests', label: 'Intereses' },
]

// Mismos nombres que RegisterRequest del back
const EMPTY_FORM = { email: '', password: '', firstname: '', lastname: '', username: '' }
const USERNAME_PATTERN = /^[a-z0-9._]{3,20}$/i
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/
const CHECK_DELAY = 450

function validateAccount(form) {
  const errors = {}
  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Ingresá un email válido.'
  if (form.password.length < MIN_PASSWORD) errors.password = `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`
  return errors
}

function validateProfile(form) {
  const errors = {}
  if (!form.firstname.trim()) errors.firstname = 'Ingresá tu nombre.'
  if (!form.lastname.trim()) errors.lastname = 'Ingresá tu apellido.'
  if (!USERNAME_PATTERN.test(form.username)) errors.username = 'Entre 3 y 20 caracteres: letras, números, punto o guion bajo.'
  return errors
}

/** Variantes de usuario a partir del nombre ("Sofía Pérez" → sofia.perez, sofiaperez, sofia_p…). */
function usernameCandidates(firstname, lastname) {
  const clean = (text) => normalizeText(text).replace(/[^a-z0-9]/g, '')
  const first = clean(firstname)
  const last = clean(lastname)
  if (!first) return []
  const year = String(new Date().getFullYear()).slice(2)
  const options = last
    ? [`${first}.${last}`, `${first}${last}`, `${first}_${last[0]}`, `${first}.${last}${year}`, `${first[0]}${last}`]
    : [first, `${first}.${year}`, `${first}_viaja`]
  return [...new Set(options.map((option) => option.slice(0, 20)))].filter((option) => USERNAME_PATTERN.test(option))
}

function StepProgress({ current }) {
  return (
    <ol className="auth-steps" aria-label="Pasos del registro">
      {REGISTER_STEPS.map((step, index) => {
        const state = index < current ? 'is-done' : index === current ? 'is-current' : ''
        return (
          <li key={step.id} className={state} aria-current={index === current ? 'step' : undefined}>
            <span className="auth-steps__label">{step.label}</span>
          </li>
        )
      })}
    </ol>
  )
}

const USERNAME_STATUS = {
  checking: { icon: LoaderCircle, text: 'Revisando…' },
  free: { icon: CircleCheck, text: '¡Está libre!' },
  taken: { icon: CircleX, text: 'Ya está en uso. Probá con otro.' },
}

/**
 * Registro en 3 pasos. Antes de pasar de paso se pregunta al back si el email y el
 * usuario están libres, así nadie elige intereses para después enterarse de que el mail ya existe.
 */
function RegisterForm({ step, onStepChange, onLogin, onDone }) {
  const { register } = useAuth()
  const [form, setForm] = useState(EMPTY_FORM)
  const [interests, setInterests] = useState([])
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [emailTaken, setEmailTaken] = useState(false)
  // Resultado del chequeo del usuario: { value, status: 'checking' | 'free' | 'taken' }
  const [usernameCheck, setUsernameCheck] = useState(null)
  // Sugerencias libres para el nombre que estaba escrito cuando se calcularon
  const [suggestions, setSuggestions] = useState({ name: '', list: [] })
  // Usuarios ya consultados al back: username → libre (true/false)
  const checked = useRef({})
  const [sending, setSending] = useState(false)

  const stepIndex = REGISTER_STEPS.findIndex((item) => item.id === step)
  const usernameStatus = usernameCheck?.value === form.username ? usernameCheck.status : null
  const nameKey = `${form.firstname}|${form.lastname}`

  const isUsernameFree = (username) => {
    if (username in checked.current) return Promise.resolve(checked.current[username])
    return checkAvailability({ username }).then((data) => {
      checked.current[username] = data.usernameAvailable
      return data.usernameAvailable
    })
  }

  const setField = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value })
    if (errors[field]) setErrors({ ...errors, [field]: undefined })
    if (field === 'email') setEmailTaken(false)
    setFormError('')
  }

  const goTo = (next) => {
    setErrors({})
    setFormError('')
    onStepChange(next)
  }

  // Chequeo en vivo del usuario, un ratito después de que se deja de escribir
  useEffect(() => {
    const value = form.username
    if (!USERNAME_PATTERN.test(value)) return undefined
    const timer = setTimeout(() => {
      if (!(value in checked.current)) setUsernameCheck({ value, status: 'checking' })
      isUsernameFree(value)
        .then((free) => setUsernameCheck({ value, status: free ? 'free' : 'taken' }))
        .catch(() => setUsernameCheck(null))
    }, CHECK_DELAY)
    return () => clearTimeout(timer)
  }, [form.username])

  // Sugerencias de usuario según el nombre: solo mostramos las que están libres
  useEffect(() => {
    const candidates = usernameCandidates(form.firstname, form.lastname)
    if (!candidates.length) return undefined
    const name = `${form.firstname}|${form.lastname}`
    const timer = setTimeout(() => {
      Promise.all(candidates.map((username) => isUsernameFree(username).then((free) => free && username)))
        .then((results) => setSuggestions({ name, list: results.filter(Boolean).slice(0, 3) }))
        .catch(() => setSuggestions({ name, list: [] }))
    }, CHECK_DELAY)
    return () => clearTimeout(timer)
  }, [form.firstname, form.lastname])

  const submitAccount = () => {
    const nextErrors = validateAccount(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return undefined
    setSending(true)
    return checkAvailability({ email: form.email.trim() })
      .then((data) => {
        if (data.emailAvailable === false) {
          setEmailTaken(true)
          setErrors({ email: 'Ya hay una cuenta con este email.' })
        } else {
          goTo('profile')
        }
      })
      .catch((err) => setFormError(err.message))
      .finally(() => setSending(false))
  }

  const submitProfile = () => {
    const nextErrors = validateProfile(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return undefined
    if (usernameStatus === 'free') return goTo('interests')
    setSending(true)
    return isUsernameFree(form.username)
      .then((free) => {
        setUsernameCheck({ value: form.username, status: free ? 'free' : 'taken' })
        if (free) goTo('interests')
      })
      .catch((err) => setFormError(err.message))
      .finally(() => setSending(false))
  }

  const createAccount = (chosen) => {
    setSending(true)
    setFormError('')
    const data = { ...form, email: form.email.trim(), firstname: form.firstname.trim(), lastname: form.lastname.trim() }
    return register(data, chosen)
      .then((user) => onDone(user, `¡Bienvenido/a, ${user.firstName}! Tu cuenta está lista.`))
      .catch((err) => {
        setSending(false)
        // Por si alguien tomó el usuario o el email mientras tanto: volvemos al paso que corresponde
        if (/usuario/i.test(err.message)) {
          checked.current[form.username] = false
          setUsernameCheck({ value: form.username, status: 'taken' })
          goTo('profile')
        } else if (/email/i.test(err.message)) {
          setEmailTaken(true)
          onStepChange('account')
          setErrors({ email: 'Ya hay una cuenta con este email.' })
        } else {
          setFormError(err.message)
        }
      })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setFormError('')
    if (step === 'account') return submitAccount()
    if (step === 'profile') return submitProfile()
    return createAccount(interests)
  }

  const fullName = `${form.firstname} ${form.lastname}`.trim()
  const status = USERNAME_STATUS[usernameStatus]
  const visibleSuggestions = suggestions.name === nameKey ? suggestions.list.filter((option) => option !== form.username) : []
  const showSuggestions = visibleSuggestions.length > 0 && (!form.username || usernameStatus === 'taken')

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <StepProgress current={stepIndex} />

      {step === 'account' && (
        <div className="auth-step" key="account">
          <FormField
            label="Email"
            type="email"
            value={form.email}
            onChange={setField('email')}
            error={errors.email}
            autoComplete="email"
            autoFocus
          />
          {emailTaken && (
            <p className="auth-taken">
              ¿Es tuya?{' '}
              <button type="button" className="auth-link" onClick={() => onLogin(form.email.trim())}>
                Iniciá sesión
              </button>
              {' '}o recuperá la contraseña desde ahí.
            </p>
          )}
          <PasswordField
            label="Contraseña"
            value={form.password}
            onChange={setField('password')}
            error={errors.password}
            hint={`Mínimo ${MIN_PASSWORD} caracteres.`}
            autoComplete="new-password"
            showStrength
          />
        </div>
      )}

      {step === 'profile' && (
        <div className="auth-step" key="profile">
          <div className="auth-preview" aria-hidden>
            <Avatar name={fullName || '?'} size="lg" />
            <div>
              <strong>{fullName || 'Tu nombre'}</strong>
              <span>@{form.username || 'usuario'}</span>
            </div>
          </div>
          <div className="form-grid">
            <FormField label="Nombre" value={form.firstname} onChange={setField('firstname')} error={errors.firstname} autoComplete="given-name" autoFocus />
            <FormField label="Apellido" value={form.lastname} onChange={setField('lastname')} error={errors.lastname} autoComplete="family-name" />
          </div>
          <div className="auth-username">
            <FormField
              label="Nombre de usuario"
              value={form.username}
              onChange={setField('username')}
              error={errors.username}
              hint={status ? undefined : 'Letras, números, punto o guion bajo.'}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
            />
            {status && !errors.username && (
              <p className={`auth-username__status auth-username__status--${usernameStatus}`} aria-live="polite">
                <status.icon size={15} aria-hidden />
                {status.text}
              </p>
            )}
            {showSuggestions && (
              <div className="auth-suggestions">
                <span>{usernameStatus === 'taken' ? 'Están libres:' : 'Ideas:'}</span>
                {visibleSuggestions.map((option) => (
                  <Chip
                    key={option}
                    onClick={() => {
                      setForm({ ...form, username: option })
                      setUsernameCheck({ value: option, status: 'free' })
                      setErrors({ ...errors, username: undefined })
                    }}
                  >
                    @{option}
                  </Chip>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {step === 'interests' && (
        <div className="auth-step" key="interests">
          <InterestPicker value={interests} onChange={setInterests} />
        </div>
      )}

      {formError && <p className="form-error">{formError}</p>}

      <div className="auth-actions">
        {stepIndex > 0 && (
          <Button variant="ghost" icon={ArrowLeft} onClick={() => goTo(REGISTER_STEPS[stepIndex - 1].id)} disabled={sending}>
            Atrás
          </Button>
        )}
        <Button type="submit" full iconRight={ArrowRight} disabled={sending || (step === 'profile' && usernameStatus === 'taken')}>
          {step === 'interests' ? (sending ? 'Creando tu cuenta…' : 'Crear mi cuenta') : sending ? 'Revisando…' : 'Continuar'}
        </Button>
      </div>

      {step === 'interests' && (
        <button type="button" className="auth-link auth-skip" onClick={() => createAccount([])} disabled={sending}>
          Ahora no, los elijo después
        </button>
      )}

      {step === 'account' ? (
        <p className="auth-switch">
          ¿Ya tenés cuenta?{' '}
          <button type="button" className="auth-link" onClick={() => onLogin(form.email.trim())}>
            Iniciá sesión
          </button>
        </p>
      ) : (
        step === 'interests' && (
          <p className="auth-legal">
            Al crear tu cuenta aceptás los{' '}
            <Link to="/terminos" target="_blank">
              Términos
            </Link>{' '}
            y la{' '}
            <Link to="/privacidad" target="_blank">
              Política de privacidad
            </Link>
            .
          </p>
        )
      )}
    </form>
  )
}

export default RegisterForm

import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, MailCheck } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { forgotPassword, verifyResetCode } from '../../services/authService'
import Button from '../ui/Button'
import FormField from '../ui/FormField'
import CodeInput from './CodeInput'
import PasswordField, { MIN_PASSWORD } from './PasswordField'

const CODE_LENGTH = 6
const RESEND_SECONDS = 30

/** "nacho@gmail.com" → "na•••@gmail.com". Si escribió un usuario, no mostramos nada. */
function maskEmail(identifier) {
  const [name, domain] = identifier.trim().split('@')
  if (!domain) return null
  return `${name.slice(0, 2)}•••@${domain}`
}

/**
 * Recuperar la contraseña en 3 pasos: pedir el código → ingresarlo → elegir la nueva.
 * Al final el back devuelve un token y la sesión queda iniciada.
 */
function ForgotPasswordForm({ step, onStepChange, identifier, onIdentifierChange, onBack, onDone }) {
  const { resetPassword } = useAuth()
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [sending, setSending] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  const [resent, setResent] = useState(false)

  // Cuenta regresiva para "Reenviar código"
  useEffect(() => {
    if (resendIn <= 0) return undefined
    const timer = setTimeout(() => setResendIn(resendIn - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendIn])

  const fail = (err) => {
    setFormError(err.message)
    setSending(false)
  }

  const goTo = (next) => {
    setErrors({})
    setFormError('')
    setSending(false)
    onStepChange(next)
  }

  const sendCode = () => {
    setSending(true)
    setFormError('')
    setResent(false)
    return forgotPassword(identifier.trim())
      .then((data) => {
        // Todavía no hay mail: en desarrollo el back devuelve el código y lo mostramos en la consola
        if (data?.devCode) console.info(`%c[eTrip] Código para recuperar la contraseña: ${data.devCode}`, 'font-weight:bold;font-size:14px')
        setCode('')
        setResendIn(RESEND_SECONDS)
        setResent(step === 'code')
        goTo('code')
      })
      .catch(fail)
  }

  const checkCode = (value) => {
    setSending(true)
    setFormError('')
    return verifyResetCode(identifier.trim(), value)
      .then(() => goTo('password'))
      .catch((err) => {
        setCode('')
        fail(err)
      })
  }

  const changeCode = (value) => {
    setCode(value)
    setFormError('')
    // Con el último dígito lo mandamos solo, sin apretar el botón
    if (value.length === CODE_LENGTH && !sending) checkCode(value)
  }

  const savePassword = () => {
    const nextErrors = {}
    if (password.length < MIN_PASSWORD) nextErrors.password = `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`
    if (confirm !== password) nextErrors.confirm = 'Las contraseñas no coinciden.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return undefined
    setSending(true)
    setFormError('')
    return resetPassword(identifier.trim(), code, password)
      .then((user) => onDone(user, 'Listo, cambiamos tu contraseña.'))
      .catch(fail)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (step === 'request') {
      if (!identifier.trim()) return setErrors({ identifier: 'Ingresá tu email o nombre de usuario.' })
      return sendCode()
    }
    if (step === 'code') {
      if (code.length < CODE_LENGTH) return setFormError(`Ingresá los ${CODE_LENGTH} dígitos del código.`)
      return checkCode(code)
    }
    return savePassword()
  }

  const masked = maskEmail(identifier)

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {step === 'request' && (
        <div className="auth-step" key="request">
          <FormField
            label="Email o usuario"
            value={identifier}
            onChange={(event) => {
              onIdentifierChange(event.target.value)
              setErrors({})
            }}
            error={errors.identifier}
            hint="Te mandamos un código de 6 dígitos al email de tu cuenta."
            autoComplete="username"
            autoFocus
          />
        </div>
      )}

      {step === 'code' && (
        <div className="auth-step auth-code" key="code">
          <span className="auth-code__icon" aria-hidden>
            <MailCheck size={26} />
          </span>
          <p className="auth-code__text">
            Te mandamos un código a {masked ? <strong>{masked}</strong> : 'el email de tu cuenta'}. Vence en 15 minutos.
          </p>
          <CodeInput value={code} onChange={changeCode} length={CODE_LENGTH} invalid={Boolean(formError)} disabled={sending} />
          <p className="auth-code__resend">
            {resent && resendIn > 0 && <span className="auth-code__sent">Listo, te mandamos uno nuevo.</span>}
            ¿No te llegó?{' '}
            {resendIn > 0 ? (
              <span className="muted">Podés pedir otro en {resendIn} s</span>
            ) : (
              <button type="button" className="auth-link" onClick={sendCode} disabled={sending}>
                Reenviar código
              </button>
            )}
          </p>
        </div>
      )}

      {step === 'password' && (
        <div className="auth-step" key="password">
          <PasswordField
            label="Contraseña nueva"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setErrors({ ...errors, password: undefined })
            }}
            error={errors.password}
            hint={`Mínimo ${MIN_PASSWORD} caracteres.`}
            autoComplete="new-password"
            autoFocus
            showStrength
          />
          <PasswordField
            label="Repetila"
            value={confirm}
            onChange={(event) => {
              setConfirm(event.target.value)
              setErrors({ ...errors, confirm: undefined })
            }}
            error={errors.confirm}
            autoComplete="new-password"
          />
        </div>
      )}

      {formError && <p className="form-error">{formError}</p>}

      <Button type="submit" full iconRight={ArrowRight} disabled={sending}>
        {{ request: 'Enviarme el código', code: 'Verificar código', password: 'Guardar y entrar' }[step]}
      </Button>

      <p className="auth-switch">
        {step === 'code' ? (
          <button type="button" className="auth-link auth-link--muted" onClick={() => goTo('request')}>
            <ArrowLeft size={14} aria-hidden /> Usar otro email o usuario
          </button>
        ) : (
          <button type="button" className="auth-link auth-link--muted" onClick={onBack}>
            <ArrowLeft size={14} aria-hidden /> Volver a iniciar sesión
          </button>
        )}
      </p>
    </form>
  )
}

export default ForgotPasswordForm

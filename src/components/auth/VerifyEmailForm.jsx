import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, MailCheck } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { resendVerification, verifyEmail } from '../../redux/authSlice'
import { maskEmail } from '../../utils/format'
import Button from '../ui/Button'
import CodeInput from './CodeInput'

const CODE_LENGTH = 6
// El back no manda otro mail a la misma cuenta antes de un minuto
const RESEND_SECONDS = 60

/**
 * Verificar el email: aparece después de registrarse y cuando alguien sin verificar intenta iniciar sesión.
 * El back ya mandó el código al crear la cuenta (o al intentar entrar). Al verificarlo devuelve el token
 * y la sesión queda iniciada.
 */
function VerifyEmailForm({ identifier, onBack, onDone }) {
  const dispatch = useDispatch()
  const [code, setCode] = useState('')
  const [formError, setFormError] = useState('')
  const [sending, setSending] = useState(false)
  // Recién se mandó un código: hay que esperar para pedir otro
  const [resendIn, setResendIn] = useState(RESEND_SECONDS)
  const [resent, setResent] = useState(false)

  // Cuenta regresiva para "Reenviar código"
  useEffect(() => {
    if (resendIn <= 0) return undefined
    const timer = setTimeout(() => setResendIn(resendIn - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendIn])

  const checkCode = (value) => {
    setSending(true)
    setFormError('')
    return dispatch(verifyEmail({ usernameOrEmail: identifier.trim(), code: value })).then((action) => {
      // rejected: el back respondió con un error (action.error.message, como en el reducer)
      if (action.error) {
        setCode('')
        setFormError(action.error.message)
        setSending(false)
        return
      }
      const { user } = action.payload
      return onDone(user, `¡Listo, ${user.firstName}! Verificamos tu email y tu cuenta está lista.`)
    })
  }

  const resend = () => {
    setSending(true)
    setFormError('')
    setResent(false)
    return dispatch(resendVerification(identifier.trim())).then((action) => {
      setSending(false)
      if (action.error) {
        setFormError(action.error.message)
        return
      }
      setCode('')
      setResent(true)
      setResendIn(RESEND_SECONDS)
    })
  }

  const changeCode = (value) => {
    setCode(value)
    setFormError('')
    // Con el último dígito lo mandamos solo, sin apretar el botón
    if (value.length === CODE_LENGTH && !sending) checkCode(value)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (code.length < CODE_LENGTH) return setFormError(`Ingresá los ${CODE_LENGTH} dígitos del código.`)
    return checkCode(code)
  }

  const masked = maskEmail(identifier)

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-step auth-code">
        <span className="auth-code__icon" aria-hidden>
          <MailCheck size={26} />
        </span>
        <p className="auth-code__text">
          Te mandamos un código a {masked ? <strong>{masked}</strong> : 'el email de tu cuenta'}. Vence en 15 minutos.
          Si no lo ves, revisá el spam.
        </p>
        <CodeInput value={code} onChange={changeCode} length={CODE_LENGTH} invalid={Boolean(formError)} disabled={sending} />
        <p className="auth-code__resend">
          {resent && resendIn > 0 && <span className="auth-code__sent">Listo, te mandamos uno nuevo.</span>}
          ¿No te llegó?{' '}
          {resendIn > 0 ? (
            <span className="muted">Podés pedir otro en {resendIn} s</span>
          ) : (
            <button type="button" className="auth-link" onClick={resend} disabled={sending}>
              Reenviar código
            </button>
          )}
        </p>
      </div>

      {formError && <p className="form-error">{formError}</p>}

      <Button type="submit" full iconRight={ArrowRight} disabled={sending}>
        {sending ? 'Verificando…' : 'Verificar y entrar'}
      </Button>

      <p className="auth-switch">
        <button type="button" className="auth-link auth-link--muted" onClick={onBack}>
          <ArrowLeft size={14} aria-hidden /> Volver a iniciar sesión
        </button>
      </p>
    </form>
  )
}

export default VerifyEmailForm

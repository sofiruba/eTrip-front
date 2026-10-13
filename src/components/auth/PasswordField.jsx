import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import FormField from '../ui/FormField'

export const MIN_PASSWORD = 6

const LEVELS = [
  { label: 'Muy corta', tone: 'weak' },
  { label: 'Débil', tone: 'weak' },
  { label: 'Aceptable', tone: 'fair' },
  { label: 'Buena', tone: 'good' },
  { label: 'Muy segura', tone: 'strong' },
]

/** 0 a 4: largo mínimo, largo cómodo, letras y números, mayúsculas o símbolos. */
function passwordScore(password) {
  if (password.length < MIN_PASSWORD) return 0
  let score = 1
  if (password.length >= 10) score += 1
  if (/[a-z]/i.test(password) && /\d/.test(password)) score += 1
  if (/[^a-z0-9]/i.test(password) || (/[a-z]/.test(password) && /[A-Z]/.test(password))) score += 1
  return score
}

function PasswordStrength({ password }) {
  const score = passwordScore(password)
  const level = LEVELS[score]
  return (
    <div className={`password-strength password-strength--${level.tone}`} aria-live="polite">
      <div className="password-strength__bars" aria-hidden>
        {[1, 2, 3, 4].map((bar) => (
          <span key={bar} className={bar <= Math.max(score, 1) ? 'is-on' : ''} />
        ))}
      </div>
      <span className="password-strength__label">
        {level.label}
        {score > 0 && score < 3 && <span className="muted"> · sumá números o símbolos</span>}
      </span>
    </div>
  )
}

/** Campo de contraseña con botón para mostrarla y, opcional, medidor de seguridad. */
function PasswordField({ showStrength = false, value, ...props }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="password-field">
      <FormField
        type={visible ? 'text' : 'password'}
        value={value}
        addon={
          <button
            type="button"
            className="field__addon"
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
          </button>
        }
        {...props}
      />
      {showStrength && value && <PasswordStrength password={value} />}
    </div>
  )
}

export default PasswordField

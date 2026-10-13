import { useEffect, useRef } from 'react'

/**
 * Código de N dígitos, una caja por dígito. Acepta pegar el código entero
 * y el autocompletado del celular (autocomplete="one-time-code").
 * `value` es siempre un string de dígitos seguidos (sin huecos).
 */
function CodeInput({ value, onChange, length = 6, invalid = false, disabled = false }) {
  const refs = useRef([])
  const digits = Array.from({ length }, (_, index) => value[index] ?? '')

  const focus = (index) => refs.current[Math.max(0, Math.min(length - 1, index))]?.focus()

  // Al aparecer, y si se borra el código desde afuera (por ejemplo, después de un error), foco en la primera caja
  useEffect(() => {
    if (!value) refs.current[0]?.focus()
  }, [value])

  const handleChange = (index) => (event) => {
    const typed = event.target.value.replace(/\D/g, '')
    if (!typed) return
    // Escribir sobre una caja ya llena reemplaza ese dígito
    if (digits[index] && typed.length <= 2) {
      const next = value.slice(0, index) + typed.at(-1) + value.slice(index + 1)
      onChange(next)
      focus(index + 1)
      return
    }
    const start = Math.min(index, value.length)
    const next = (value.slice(0, start) + typed).slice(0, length)
    onChange(next)
    focus(next.length)
  }

  const handleKeyDown = (index) => (event) => {
    if (event.key === 'Backspace') {
      event.preventDefault()
      const target = digits[index] ? index : index - 1
      if (target < 0) return
      onChange(value.slice(0, target) + value.slice(target + 1))
      focus(target)
    } else if (event.key === 'ArrowLeft') {
      focus(index - 1)
    } else if (event.key === 'ArrowRight') {
      focus(index + 1)
    }
  }

  return (
    <div className={`code-input ${invalid ? 'code-input--invalid' : ''}`} role="group" aria-label={`Código de ${length} dígitos`}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element
          }}
          value={digit}
          onChange={handleChange(index)}
          onKeyDown={handleKeyDown(index)}
          onFocus={(event) => event.target.select()}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          disabled={disabled}
          aria-label={`Dígito ${index + 1} de ${length}`}
          aria-invalid={invalid}
        />
      ))}
    </div>
  )
}

export default CodeInput

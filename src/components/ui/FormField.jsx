import { useId } from 'react'
import './FormField.css'

/**
 * Campo de formulario con label, ayuda y error.
 * as: 'input' | 'textarea' | 'select' (en select, children son las <option>).
 * addon: elemento que se superpone a la derecha del control (p. ej. mostrar contraseña).
 */
function FormField({ label, hint, error, as: Control = 'input', addon, children, className = '', ...props }) {
  const id = useId()
  const hintId = `${id}-hint`

  return (
    <div className={`field ${error ? 'field--error' : ''} ${className}`}>
      <label htmlFor={id}>{label}</label>
      {addon ? (
        <div className="field__control">
          <Control id={id} aria-invalid={Boolean(error)} aria-describedby={hint || error ? hintId : undefined} {...props}>
            {children}
          </Control>
          {addon}
        </div>
      ) : (
        <Control id={id} aria-invalid={Boolean(error)} aria-describedby={hint || error ? hintId : undefined} {...props}>
          {children}
        </Control>
      )}
      {(error || hint) && (
        <small id={hintId} className="field__hint">
          {error || hint}
        </small>
      )}
    </div>
  )
}

export function FormActions({ onCancel, cancelLabel = 'Cancelar', submitLabel = 'Guardar cambios', children }) {
  return (
    <div className="form-actions">
      {children}
      {onCancel && (
        <button type="button" className="btn btn--ghost btn--md" onClick={onCancel}>
          {cancelLabel}
        </button>
      )}
      <button type="submit" className="btn btn--primary btn--md">
        {submitLabel}
      </button>
    </div>
  )
}

export default FormField

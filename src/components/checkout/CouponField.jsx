import { useState } from 'react'
import { Tag, X } from 'lucide-react'

/** Link "Ingresá un cupón" que se despliega en un input. */
function CouponField({ coupon, onApply, onRemove }) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')

  if (coupon?.valid) {
    return (
      <div className="coupon-chip">
        <Tag size={14} aria-hidden />
        <span>
          <strong>{coupon.code}</strong> · {coupon.percentage}% de descuento
        </span>
        <button
          type="button"
          aria-label="Quitar cupón"
          onClick={() => {
            onRemove()
            setCode('')
          }}
        >
          <X size={14} aria-hidden />
        </button>
      </div>
    )
  }

  if (!open) {
    return (
      <button type="button" className="checkout-link" onClick={() => setOpen(true)}>
        Ingresá un cupón
      </button>
    )
  }

  const apply = () => code.trim() && onApply(code)

  return (
    <div className="coupon-field">
      <div className="coupon-field__row">
        <input
          aria-label="Código de cupón"
          value={code}
          placeholder="Ej: PLANFINDE10"
          autoFocus
          aria-invalid={Boolean(coupon && !coupon.valid)}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              apply()
            }
          }}
        />
        <button type="button" className="checkout-pill" onClick={apply} disabled={!code.trim()}>
          Aplicar
        </button>
      </div>
      {coupon && !coupon.valid && <small className="coupon-field__error">{coupon.reason}</small>}
    </div>
  )
}

export default CouponField

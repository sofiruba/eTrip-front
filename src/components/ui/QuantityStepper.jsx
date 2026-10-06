import { Minus, Plus } from 'lucide-react'
import './QuantityStepper.css'

function QuantityStepper({ value, min = 1, max = 99, onChange, label = 'Cantidad' }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" aria-label="Restar uno" disabled={value <= min} onClick={() => onChange(value - 1)}>
        <Minus size={16} aria-hidden />
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" aria-label="Sumar uno" disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Plus size={16} aria-hidden />
      </button>
    </div>
  )
}

export default QuantityStepper

import { Check } from 'lucide-react'
import './Chip.css'

/** Botón tipo píldora para filtros e intereses. */
function Chip({ selected = false, icon: Icon, showCheck = false, children, ...props }) {
  return (
    <button type="button" className={`chip ${selected ? 'is-selected' : ''}`} aria-pressed={selected} {...props}>
      {Icon && <Icon size={16} aria-hidden />}
      {children}
      {showCheck && selected && <Check size={14} aria-hidden />}
    </button>
  )
}

export default Chip

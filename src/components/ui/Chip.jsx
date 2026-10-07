import { Check } from 'lucide-react'
import './Chip.css'

/** Botón tipo píldora para filtros e intereses. */
function Chip({ selected = false, icon: Icon, iconSize = 16, showCheck = false, className = '', children, ...props }) {
  return (
    <button
      type="button"
      className={`chip ${selected ? 'is-selected' : ''} ${className}`.trim()}
      aria-pressed={selected}
      {...props}
    >
      {Icon && <Icon size={iconSize} strokeWidth={iconSize > 16 ? 1.5 : 2} aria-hidden />}
      {children}
      {showCheck && selected && <Check size={14} aria-hidden />}
    </button>
  )
}

export default Chip

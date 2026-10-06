import './IconButton.css'

/** Botón cuadrado solo con ícono. `label` es obligatorio por accesibilidad. */
function IconButton({ icon: Icon, label, variant = 'default', active = false, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`icon-btn icon-btn--${variant} ${active ? 'is-active' : ''} ${className}`}
      aria-label={label}
      title={label}
      {...props}
    >
      <Icon size={18} aria-hidden />
    </button>
  )
}

export default IconButton

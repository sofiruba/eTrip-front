import { Link } from 'react-router-dom'
import './Button.css'

/**
 * Botón único de la app. Si recibe `to` se renderiza como Link.
 * variant: primary | secondary | ghost | danger
 */
function Button({
  variant = 'primary',
  size = 'md',
  full = false,
  icon: Icon,
  iconRight: IconRight,
  to,
  type = 'button',
  className = '',
  children,
  ...props
}) {
  const classes = ['btn', `btn--${variant}`, `btn--${size}`, full && 'btn--full', className].filter(Boolean).join(' ')
  const iconSize = size === 'sm' ? 16 : 18
  const content = (
    <>
      {Icon && <Icon size={iconSize} aria-hidden />}
      {children}
      {IconRight && <IconRight size={iconSize} aria-hidden />}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    )
  }

  return (
    <button type={type} className={classes} {...props}>
      {content}
    </button>
  )
}

export default Button

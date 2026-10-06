import { initials } from '../../utils/format'
import './Avatar.css'

/** size: sm | md | lg | xl */
function Avatar({ name, size = 'md' }) {
  return (
    <span className={`avatar avatar--${size}`} aria-hidden>
      {initials(name)}
    </span>
  )
}

export default Avatar

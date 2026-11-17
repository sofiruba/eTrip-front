import { useState } from 'react'
import { initials } from '../../utils/format'
import './Avatar.css'

/**
 * Foto de perfil, o las iniciales si no hay foto (o no carga).
 * src: URL o data URL (la foto de perfil la guarda el back).
 * size: sm | md | lg | xl
 */
function Avatar({ name, src, size = 'md' }) {
  const [failedSrc, setFailedSrc] = useState(null)

  if (src && failedSrc !== src) {
    return <img className={`avatar avatar--${size}`} src={src} alt="" aria-hidden onError={() => setFailedSrc(src)} />
  }

  return (
    <span className={`avatar avatar--${size}`} aria-hidden>
      {initials(name)}
    </span>
  )
}

export default Avatar

import { useState } from 'react'
import { initials } from '../../utils/format'
import './Avatar.css'

/**
 * Foto de perfil, o las iniciales si no hay foto (o no carga).
 * src: URL o data URL (el back la manda como avatarBase64).
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

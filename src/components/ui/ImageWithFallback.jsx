import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import './ImageWithFallback.css'

/** Imagen que muestra un placeholder si no hay src o si falla la carga. */
function ImageWithFallback({ src, alt = '', className = '', ...props }) {
  const [failedSrc, setFailedSrc] = useState(null)

  if (!src || failedSrc === src) {
    return (
      <div className={`image-fallback ${className}`} role={alt ? 'img' : undefined} aria-label={alt || undefined}>
        <ImageOff size={28} aria-hidden />
      </div>
    )
  }

  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailedSrc(src)} {...props} />
}

export default ImageWithFallback

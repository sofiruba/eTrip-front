import { useState } from 'react'
import ImageWithFallback from '../ui/ImageWithFallback'
import './Gallery.css'

function Gallery({ images, title }) {
  const [active, setActive] = useState(0)

  return (
    <div className="gallery">
      <ImageWithFallback className="gallery__main" src={images[active]} alt={title} />
      {images.length > 1 && (
        <div className="gallery__thumbs">
          {/* Las fotos no tienen id y la lista no cambia mientras se ve: la posición sirve de key
              (usar el base64 como key repetía keys si se subía dos veces la misma foto) */}
          {images.map((image, index) => (
            <button
              type="button"
              key={index}
              className={index === active ? 'is-active' : ''}
              aria-label={`Ver foto ${index + 1}`}
              onClick={() => setActive(index)}
            >
              <ImageWithFallback src={image} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Gallery

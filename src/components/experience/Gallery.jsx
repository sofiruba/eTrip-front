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
          {images.map((image, index) => (
            <button
              type="button"
              key={image}
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

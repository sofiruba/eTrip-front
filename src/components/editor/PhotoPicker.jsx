import { useEffect, useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import './PhotoPicker.css'

export const MAX_PHOTOS = 5
const MAX_PHOTO_MB = 5
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Las fotos del back son textos (data URL); las nuevas, { file, preview }
const srcOf = (image) => (typeof image === 'string' ? image : image.preview)

/**
 * Fotos de la experiencia: muestra las que hay, deja quitar y agregar.
 * Las nuevas se guardan como File (van en el FormData) con una vista previa.
 */
function PhotoPicker({ images, onChange, error }) {
  const [uploadError, setUploadError] = useState('')
  const createdUrls = useRef([])

  // Al desmontar liberamos las URLs temporales de las vistas previas
  useEffect(() => () => createdUrls.current.forEach(URL.revokeObjectURL), [])

  const addPhotos = (event) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    const valid = files.filter((file) => PHOTO_TYPES.includes(file.type) && file.size <= MAX_PHOTO_MB * 1024 * 1024)
    const room = MAX_PHOTOS - images.length
    const problems = []
    if (valid.length < files.length) problems.push(`Solo JPG, PNG o WEBP de hasta ${MAX_PHOTO_MB} MB.`)
    if (valid.length > room) problems.push(`Máximo ${MAX_PHOTOS} fotos: agregamos ${room}.`)
    setUploadError(problems.join(' '))

    const photos = valid.slice(0, room).map((file) => ({ file, preview: URL.createObjectURL(file) }))
    createdUrls.current.push(...photos.map((photo) => photo.preview))
    onChange([...images, ...photos])
  }

  return (
    <>
      <div className="photo-picker">
        {images.map((image, index) => (
          <div key={srcOf(image)} className="photo-picker__photo">
            <img src={srcOf(image)} alt="" />
            {index === 0 && <span className="photo-picker__cover">Portada</span>}
            <button type="button" aria-label="Quitar foto" onClick={() => onChange(images.filter((entry) => entry !== image))}>
              <X size={14} aria-hidden />
            </button>
          </div>
        ))}
        {images.length < MAX_PHOTOS && (
          <label className="photo-picker__upload">
            <input type="file" accept={PHOTO_TYPES.join(',')} multiple onChange={addPhotos} />
            <ImagePlus size={24} aria-hidden />
            <span>Agregar fotos</span>
          </label>
        )}
      </div>
      {(uploadError || error) && <p className="form-error">{uploadError || error}</p>}
    </>
  )
}

export default PhotoPicker

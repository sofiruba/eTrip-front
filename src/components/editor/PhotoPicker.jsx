import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Plus, Star, X } from 'lucide-react'
import './PhotoPicker.css'

export const MAX_PHOTOS = 5
const MAX_PHOTO_MB = 5
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Las fotos del back son textos (data URL); las nuevas, { file, preview }
const srcOf = (image) => (typeof image === 'string' ? image : image.preview)

/**
 * Fotos de la experiencia: se eligen o se arrastran, se pueden quitar y elegir cuál es la portada (la primera).
 * Las nuevas se guardan como File (van en el FormData) con una vista previa.
 */
function PhotoPicker({ images, onChange, error }) {
  const [uploadError, setUploadError] = useState('')
  const [dragging, setDragging] = useState(false)
  const createdUrls = useRef([])

  // Al desmontar liberamos las URLs temporales de las vistas previas
  useEffect(() => () => createdUrls.current.forEach(URL.revokeObjectURL), [])

  // Agrega las fotos válidas (formato y peso) hasta llegar al máximo
  const addFiles = (fileList) => {
    const files = Array.from(fileList ?? [])
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

  const pickFiles = (event) => {
    addFiles(event.target.files)
    event.target.value = '' // permite volver a elegir la misma foto
  }

  // Arrastrar fotos desde la compu
  const dropProps = {
    onDragOver: (event) => {
      event.preventDefault()
      setDragging(true)
    },
    onDragLeave: () => setDragging(false),
    onDrop: (event) => {
      event.preventDefault()
      setDragging(false)
      addFiles(event.dataTransfer.files)
    },
  }

  // Se quitan por posición (con la misma foto subida dos veces, filtrar por contenido borraba las dos)
  const remove = (index) => onChange(images.filter((_, position) => position !== index))
  const makeCover = (index) => onChange([images[index], ...images.filter((_, position) => position !== index)])

  const input = <input type="file" accept={PHOTO_TYPES.join(',')} multiple onChange={pickFiles} />
  const message = uploadError || error

  // Sin fotos: una zona grande para elegir o arrastrar
  if (!images.length) {
    return (
      <>
        <label className={`photo-drop ${dragging ? 'is-dragging' : ''} ${error ? 'has-error' : ''}`} {...dropProps}>
          {input}
          <span className="photo-drop__icon">
            <ImagePlus size={26} aria-hidden />
          </span>
          <strong>Arrastrá tus fotos acá</strong>
          <span className="muted small">o</span>
          <span className="photo-drop__button">Elegir fotos</span>
          <small className="muted">
            JPG, PNG o WEBP · hasta {MAX_PHOTO_MB} MB · máximo {MAX_PHOTOS} fotos
          </small>
        </label>
        {message && <p className="form-error">{message}</p>}
      </>
    )
  }

  return (
    <>
      <div className={`photo-picker ${dragging ? 'is-dragging' : ''}`} {...dropProps}>
        {images.map((image, index) => (
          <figure key={`${index}-${srcOf(image).slice(-24)}`} className={`photo-picker__photo ${index === 0 ? 'is-cover' : ''}`}>
            <img src={srcOf(image)} alt={index === 0 ? 'Foto de portada' : `Foto ${index + 1}`} />
            {index === 0 ? (
              <span className="photo-picker__badge">
                <Star size={12} aria-hidden /> Portada
              </span>
            ) : (
              <button type="button" className="photo-picker__make-cover" onClick={() => makeCover(index)}>
                Usar de portada
              </button>
            )}
            <button type="button" className="photo-picker__remove" aria-label="Quitar foto" onClick={() => remove(index)}>
              <X size={14} aria-hidden />
            </button>
          </figure>
        ))}

        {images.length < MAX_PHOTOS && (
          <label className="photo-picker__add">
            {input}
            <Plus size={22} aria-hidden />
            <span>Agregar</span>
          </label>
        )}
      </div>
      <p className="photo-picker__count muted small">
        {images.length} de {MAX_PHOTOS} fotos · la portada es la que se ve primero en el catálogo
      </p>
      {message && <p className="form-error">{message}</p>}
    </>
  )
}

export default PhotoPicker

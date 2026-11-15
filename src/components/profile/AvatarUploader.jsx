import { useRef } from 'react'
import { Camera } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { updateProfileExtras } from '../../redux/authSlice'
import { showToast } from '../../redux/toastsSlice'
import { fullName } from '../../utils/format'
import Avatar from '../ui/Avatar'
import './AvatarUploader.css'

const MAX_MB = 5
const TYPES = ['image/jpeg', 'image/png', 'image/webp']
// Lado máximo de la foto guardada, en px (el avatar más grande se ve a ~120 px)
const AVATAR_SIZE = 320

/**
 * Achica la foto antes de guardarla. La foto queda en el estado global, que redux-persist guarda en el localStorage
 * (~5 MB para todo el sitio): una foto de celular
 * en base64 no entraba, no se guardaba (sin avisar) y desde ahí tampoco se guardaba el resto del perfil.
 * Devuelve una promesa con el data URL (JPEG de pocos KB).
 */
function shrinkPhoto(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      const scale = Math.min(1, AVATAR_SIZE / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      const context = canvas.getContext('2d')
      context.fillStyle = '#fff' // un PNG transparente no queda con fondo negro al pasar a JPEG
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la foto'))
    }
    image.src = url
  })
}

/** Foto de perfil. El back no guarda fotos de usuario: queda en el estado global, persistida en este navegador. */
// `buttonRef` deja que el padre abra el selector de foto (por ejemplo, desde "Completá tu perfil")
function AvatarUploader({ buttonRef }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const inputRef = useRef(null)

  const handleFile = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!TYPES.includes(file.type)) return dispatch(showToast({ message: 'Usá una foto JPG, PNG o WEBP.', tone: 'error' }))
    if (file.size > MAX_MB * 1024 * 1024) return dispatch(showToast({ message: `La foto puede pesar hasta ${MAX_MB} MB.`, tone: 'error' }))

    return shrinkPhoto(file)
      .then((avatarUrl) => {
        dispatch(updateProfileExtras({ avatarUrl }))
        dispatch(showToast({ message: 'Foto de perfil actualizada' }))
      })
      .catch(() => dispatch(showToast({ message: 'No pudimos leer la foto. Probá con otra.', tone: 'error' })))
  }

  const removePhoto = () => {
    dispatch(updateProfileExtras({ avatarUrl: null }))
    dispatch(showToast({ message: 'Quitaste tu foto de perfil', tone: 'info' }))
  }

  return (
    <div className="avatar-uploader">
      <div className="avatar-uploader__frame">
        <Avatar name={fullName(user)} src={user.avatarUrl} size="xl" />
        <button
          ref={buttonRef}
          type="button"
          className="avatar-uploader__button"
          aria-label={user.avatarUrl ? 'Cambiar foto de perfil' : 'Subir foto de perfil'}
          title={user.avatarUrl ? 'Cambiar foto' : 'Subir foto'}
          onClick={() => inputRef.current?.click()}
        >
          <Camera size={16} aria-hidden />
        </button>
        <input ref={inputRef} type="file" accept={TYPES.join(',')} hidden onChange={handleFile} />
      </div>
      {user.avatarUrl && (
        <button type="button" className="avatar-uploader__remove" onClick={removePhoto}>
          Quitar foto
        </button>
      )}
    </div>
  )
}

export default AvatarUploader

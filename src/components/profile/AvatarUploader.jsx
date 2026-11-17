import { useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { updateMe } from '../../redux/authSlice'
import { showToast } from '../../redux/toastsSlice'
import { fullName } from '../../utils/format'
import Avatar from '../ui/Avatar'
import './AvatarUploader.css'

const MAX_MB = 5
const TYPES = ['image/jpeg', 'image/png', 'image/webp']
// Lado máximo de la foto guardada, en px (el avatar más grande se ve a ~120 px)
const AVATAR_SIZE = 320

/**
 * Achica la foto antes de mandarla al back (que acepta hasta 400 KB): una foto de celular pesa varios MB,
 * y a 320 px en JPEG quedan unos pocos KB. Devuelve una promesa con el data URL.
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

/** Foto de perfil. Se guarda en el back (PUT /users/me con `avatarBase64`): se ve en el perfil público y en las experiencias. */
// `buttonRef` deja que el padre abra el selector de foto (por ejemplo, desde "Completá tu perfil")
function AvatarUploader({ buttonRef }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const inputRef = useRef(null)
  const [saving, setSaving] = useState(false)

  // PUT con la foto (o con "" para borrarla); el reducer guarda el usuario que devuelve el back
  const savePhoto = (avatarBase64, message) => {
    setSaving(true)
    return dispatch(updateMe({ avatarBase64 }))
      .then((action) => {
        setSaving(false)
        if (action.error) {
          return dispatch(showToast({ message: action.error.message, tone: 'error' }))
        }
        return dispatch(showToast({ message, tone: avatarBase64 ? 'success' : 'info' }))
      })
  }

  const handleFile = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!TYPES.includes(file.type)) return dispatch(showToast({ message: 'Usá una foto JPG, PNG o WEBP.', tone: 'error' }))
    if (file.size > MAX_MB * 1024 * 1024) return dispatch(showToast({ message: `La foto puede pesar hasta ${MAX_MB} MB.`, tone: 'error' }))

    return shrinkPhoto(file)
      .then((dataUrl) => savePhoto(dataUrl, 'Foto de perfil actualizada'))
      .catch(() => dispatch(showToast({ message: 'No pudimos leer la foto. Probá con otra.', tone: 'error' })))
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
          disabled={saving}
          onClick={() => inputRef.current?.click()}
        >
          <Camera size={16} aria-hidden />
        </button>
        <input ref={inputRef} type="file" accept={TYPES.join(',')} hidden onChange={handleFile} />
      </div>
      {user.avatarUrl && (
        <button type="button" className="avatar-uploader__remove" disabled={saving} onClick={() => savePhoto('', 'Quitaste tu foto de perfil')}>
          Quitar foto
        </button>
      )}
    </div>
  )
}

export default AvatarUploader

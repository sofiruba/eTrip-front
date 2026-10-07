import { useRef } from 'react'
import { Camera } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { fullName } from '../../utils/format'
import Avatar from '../ui/Avatar'
import './AvatarUploader.css'

const MAX_MB = 5
const TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Foto de perfil editable. En el mock se guarda como data URL; al conectar el back,
 * el archivo va en un multipart a PUT /users/me/avatar (y DELETE para quitarla).
 */
function AvatarUploader() {
  const { user, updateProfile } = useAuth()
  const notify = useToast()
  const inputRef = useRef(null)

  const handleFile = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!TYPES.includes(file.type)) return notify('Usá una foto JPG, PNG o WEBP.', 'error')
    if (file.size > MAX_MB * 1024 * 1024) return notify(`La foto puede pesar hasta ${MAX_MB} MB.`, 'error')

    const reader = new FileReader()
    reader.onload = () => {
      updateProfile({ avatarUrl: reader.result })
      notify('Foto de perfil actualizada')
    }
    reader.onerror = () => notify('No pudimos leer la foto. Probá con otra.', 'error')
    return reader.readAsDataURL(file)
  }

  const removePhoto = () => {
    updateProfile({ avatarUrl: null })
    notify('Quitaste tu foto de perfil', 'info')
  }

  return (
    <div className="avatar-uploader">
      <div className="avatar-uploader__frame">
        <Avatar name={fullName(user)} src={user.avatarUrl} size="xl" />
        <button
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

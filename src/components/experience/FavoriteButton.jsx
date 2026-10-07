import { Heart } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useFavorites } from '../../hooks/useFavorites'
import { useToast } from '../../hooks/useToast'
import IconButton from '../ui/IconButton'

function FavoriteButton({ experienceId, variant = 'overlay', className }) {
  const { isFavorite, toggleFavorite, saveAfterLogin } = useFavorites()
  const { user, isAdmin, openAuth } = useAuth()
  const notify = useToast()
  const saved = isFavorite(experienceId)

  // La cuenta admin no guarda favoritos
  if (isAdmin) return null

  const handleClick = () => {
    // Sin sesión no hay dónde guardarlo: se pide ingresar y se guarda después
    if (!user) {
      saveAfterLogin(experienceId)
      notify('Ingresá para guardar experiencias', 'favorite')
      openAuth('login')
      return
    }
    toggleFavorite(experienceId)
    if (saved) notify('Quitada de tus guardados', 'unfavorite')
    else notify('Guardada en tu perfil', 'favorite', { label: 'Ver guardados', to: '/perfil' })
  }

  return (
    <IconButton
      icon={Heart}
      label={saved ? 'Quitar de guardados' : 'Guardar experiencia'}
      variant={variant}
      active={saved}
      aria-pressed={saved}
      className={className}
      onClick={handleClick}
    />
  )
}

export default FavoriteButton

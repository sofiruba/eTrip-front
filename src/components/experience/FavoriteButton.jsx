import { Heart } from 'lucide-react'
import { useFavorites } from '../../hooks/useFavorites'
import { useToast } from '../../hooks/useToast'
import IconButton from '../ui/IconButton'

function FavoriteButton({ experienceId, variant = 'overlay', className }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const notify = useToast()
  const saved = isFavorite(experienceId)

  const handleClick = () => {
    toggleFavorite(experienceId)
    notify(saved ? 'Quitado de tus guardados' : 'Guardado en tu perfil', 'info')
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

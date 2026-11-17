import { Heart } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { openAuth } from '../../redux/authSlice'
import { addFavorite, removeFavorite } from '../../redux/favoritesSlice'
import { showToast } from '../../redux/toastsSlice'
import './FavoriteButton.css'

/**
 * Corazón para guardar una experiencia (POST / DELETE /favorites/{id}). Lee del store si ya está guardada.
 * Sin sesión abre el login. No se muestra al admin ni al dueño de la experiencia.
 * `withLabel`: con texto ("Guardar" / "Guardada"), para el detalle; sin texto queda como botón redondo en las tarjetas.
 */
function FavoriteButton({ experience, withLabel = false, className = '' }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const saved = useSelector((state) => state.favorites.ids.includes(experience.id))

  if (user?.role === 'ADMIN' || user?.id === experience.publisherId) return null

  const toggle = (event) => {
    // Dentro de una tarjeta el botón está sobre un link: que el clic no abra el detalle
    event.preventDefault()
    event.stopPropagation()
    if (!user) return dispatch(openAuth({ mode: 'login' }))
    const action = saved ? removeFavorite(experience.id) : addFavorite(experience.id)
    return dispatch(action)
      .then((result) => {
        if (result.error) {
          return dispatch(showToast({ message: result.error.message, tone: 'error' }))
        }
        if (saved) return dispatch(showToast({ message: 'Quitada de tus guardados', tone: 'info' }))
        return dispatch(showToast({ message: 'Guardada en tus favoritos', link: { label: 'Ver guardados', to: '/guardados' } }))
      })
  }

  const label = saved ? 'Quitar de guardados' : 'Guardar'
  return (
    <button
      type="button"
      className={`favorite-btn ${saved ? 'is-saved' : ''} ${withLabel ? 'favorite-btn--label' : ''} ${className}`.trim()}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      onClick={toggle}
    >
      <Heart size={withLabel ? 18 : 20} aria-hidden />
      {withLabel && (saved ? 'Guardada' : 'Guardar')}
    </button>
  )
}

export default FavoriteButton

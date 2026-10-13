import { fullName } from '../../utils/format'
import { buildLocation } from '../../utils/location'
import { getFinalPrice } from '../../utils/orders'
import ExperienceCard from '../experience/ExperienceCard'
import './EditorPreview.css'

/** Vista previa de la tarjeta con lo que se va escribiendo en el formulario. */
function EditorPreview({ form, user }) {
  const price = Number(form.price) || 0
  const discountPercentage = Number(form.discountPercentage) || 0

  const preview = {
    id: 0,
    title: form.title,
    images: form.images.map((image) => (typeof image === 'string' ? image : image.preview)),
    price,
    discountPercentage,
    finalPrice: getFinalPrice({ price, discountPercentage }),
    publisherName: fullName(user),
    location: buildLocation(form.area || 'Tu barrio', form.city || 'Tu ciudad'),
    averageRating: 0,
    reviewCount: 0,
    nextSession: null,
    upcomingCount: 0,
  }

  return (
    <aside className="editor-preview">
      <span className="eyebrow">Vista previa</span>
      <ExperienceCard experience={preview} to={null} showFavorite={false} />
      <p className="muted small">Así se va a ver en el listado.</p>
    </aside>
  )
}

export default EditorPreview

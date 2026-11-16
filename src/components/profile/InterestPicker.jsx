import { useSelector } from 'react-redux'
import { pluralize } from '../../utils/format'
import Chip from '../ui/Chip'
import { getInterestIcon } from './interestIcons'
import './InterestPicker.css'

/**
 * Selector de intereses. La lista sale del back (slice interests, se pide al abrir la app): la administra el admin,
 * viene ordenada por categoría y cada interés trae cuántos planes disponibles tiene (lo cuenta el back).
 * Lo usan el registro y el perfil (intereses de la persona, hasta 20) y el editor de experiencias
 * (tags, `max` = 8 y sin contador). El back valida lo mismo al guardar.
 */
function InterestPicker({ value, onChange, max = 20, showCounts = true }) {
  const { items: interests, loaded, error } = useSelector((state) => state.interests)
  const full = value.length >= max

  const toggle = (interest) =>
    onChange(value.includes(interest) ? value.filter((item) => item !== interest) : [...value, interest])

  if (error) return <p className="form-error">No pudimos cargar los intereses: {error}</p>
  if (!loaded) return <p className="muted small">Cargando intereses…</p>

  // El back ya los manda ordenados por categoría: arrancamos un grupo nuevo cada vez que cambia
  const groups = []
  interests.forEach((interest) => {
    const last = groups[groups.length - 1]
    if (last?.name === interest.categoryName) last.items.push(interest)
    else groups.push({ name: interest.categoryName, items: [interest] })
  })

  return (
    <div className="interest-picker">
      {groups.map((group) => (
        <div key={group.name} className="interest-picker__group">
          <p className="interest-picker__group-title">{group.name}</p>
          <div className="chip-list">
            {group.items.map((interest) => {
              const selected = value.includes(interest.name)
              return (
                <Chip
                  key={interest.id}
                  className="chip--interest"
                  icon={getInterestIcon(interest.name)}
                  iconSize={22}
                  selected={selected}
                  disabled={full && !selected}
                  onClick={() => toggle(interest.name)}
                >
                  {interest.name}
                  {showCounts && (
                    <span className="interest-picker__plans">{pluralize(interest.availableExperiences, 'plan', 'planes')}</span>
                  )}
                </Chip>
              )
            })}
          </div>
        </div>
      ))}
      <div className="interest-picker__footer">
        <span className={`interest-picker__count ${full ? 'is-full' : ''}`} aria-live="polite">
          {value.length}/{max} seleccionados
        </span>
      </div>
    </div>
  )
}

export default InterestPicker

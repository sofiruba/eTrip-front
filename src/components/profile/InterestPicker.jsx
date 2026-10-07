import { useState } from 'react'
import { featuredInterests, interestOptions, MAX_INTERESTS } from '../../data'
import Chip from '../ui/Chip'
import { getInterestIcon } from './interestIcons'
import './InterestPicker.css'

/** Selector de intereses (registro y perfil): primero los más elegidos y "Mostrar todo" para el resto. */
function InterestPicker({ value, onChange }) {
  const [showAll, setShowAll] = useState(false)
  const full = value.length >= MAX_INTERESTS

  const toggle = (interest) =>
    onChange(value.includes(interest) ? value.filter((item) => item !== interest) : [...value, interest])

  // Los elegidos que no están entre los destacados se muestran igual, para poder sacarlos
  const visible = showAll
    ? interestOptions
    : [...featuredInterests, ...value.filter((interest) => !featuredInterests.includes(interest))]

  return (
    <div className="interest-picker">
      <div className="chip-list">
        {visible.map((interest) => {
          const selected = value.includes(interest)
          return (
            <Chip
              key={interest}
              className="chip--interest"
              icon={getInterestIcon(interest)}
              iconSize={22}
              selected={selected}
              disabled={full && !selected}
              onClick={() => toggle(interest)}
            >
              {interest}
            </Chip>
          )
        })}
      </div>
      <div className="interest-picker__footer">
        <button type="button" className="interest-picker__more" onClick={() => setShowAll((current) => !current)}>
          {showAll ? 'Mostrar menos' : `Mostrar todo (${interestOptions.length})`}
        </button>
        <span className={`interest-picker__count ${full ? 'is-full' : ''}`} aria-live="polite">
          {value.length}/{MAX_INTERESTS} seleccionados
        </span>
      </div>
    </div>
  )
}

export default InterestPicker

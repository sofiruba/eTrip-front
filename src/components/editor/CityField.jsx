import { useId, useState } from 'react'
import { Building2, MapPin } from 'lucide-react'
import { cities } from '../../data/cities'
import { useCatalog } from '../../hooks/useCatalog'
import { getDestinations } from '../../utils/experiences'
import { normalizeText, pluralize } from '../../utils/format'
import FormField from '../ui/FormField'
import './CityField.css'

const MAX_OPTIONS = 6

/**
 * Campo "Ciudad" con sugerencias propias (reemplaza al <datalist> del navegador, que no se puede estilar).
 * Primero las ciudades que ya tienen experiencias publicadas (salen del catálogo, o sea del back), con cuántas tiene
 * cada una; después las ciudades conocidas de data/cities.js. Se puede escribir cualquier ciudad aunque no esté en la lista.
 * Teclado: ↑ ↓ para moverse, Enter elige, Escape cierra (patrón combobox de ARIA).
 */
function CityField({ value, error, onChange }) {
  const { experiences } = useCatalog()
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const destinations = getDestinations(experiences)
  const typed = normalizeText(value.trim())
  const matches = (city) => !typed || normalizeText(`${city.name} ${city.country ?? ''}`).includes(typed)
  const withExperiences = destinations.filter(matches).slice(0, MAX_OPTIONS)
  const others = cities
    .filter((city) => !destinations.some((entry) => entry.name === city.name) && matches(city))
    .slice(0, Math.max(0, MAX_OPTIONS - withExperiences.length))
  const options = [...withExperiences, ...others]
  // Si lo escrito ya es exactamente una opción, no hace falta mostrar la lista
  const exact = options.length === 1 && normalizeText(options[0].name) === typed
  const showList = open && options.length > 0 && !exact

  const pick = (city) => {
    onChange(city.name)
    setOpen(false)
    setActiveIndex(-1)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!showList) return setOpen(true)
      const step = event.key === 'ArrowDown' ? 1 : -1
      return setActiveIndex((current) => (current + step + options.length) % options.length)
    }
    if (event.key === 'Enter' && showList && activeIndex >= 0) {
      event.preventDefault() // elige la ciudad en vez de mandar el formulario
      return pick(options[activeIndex])
    }
    if (event.key === 'Escape' && showList) {
      event.stopPropagation()
      setOpen(false)
    }
    return undefined
  }

  const renderOption = (city, index) => (
    <li
      key={city.name}
      id={`${listId}-${index}`}
      role="option"
      aria-selected={index === activeIndex}
      className={`city-field__option ${index === activeIndex ? 'is-active' : ''}`}
      // mousedown (y no click) para que el input no pierda el foco antes de elegir
      onMouseDown={(event) => {
        event.preventDefault()
        pick(city)
      }}
      onMouseEnter={() => setActiveIndex(index)}
    >
      <span className="city-field__icon">{city.count ? <Building2 size={18} aria-hidden /> : <MapPin size={18} aria-hidden />}</span>
      <span className="city-field__text">
        <strong>{city.name}</strong>
        <small>{[city.country, city.count ? pluralize(city.count, 'experiencia') : null].filter(Boolean).join(' · ')}</small>
      </span>
    </li>
  )

  return (
    <div className="city-field">
      <FormField
        label="Ciudad"
        value={value}
        error={error}
        placeholder="Buenos Aires"
        required
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        onChange={(event) => {
          onChange(event.target.value)
          setOpen(true)
          setActiveIndex(-1)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
      />

      {showList && (
        <ul className="city-field__list" id={listId} role="listbox" aria-label="Ciudades sugeridas">
          {withExperiences.length > 0 && (
            <li className="city-field__group" role="presentation">
              Con experiencias en PLAN
            </li>
          )}
          {withExperiences.map((city, index) => renderOption(city, index))}
          {others.length > 0 && (
            <li className="city-field__group" role="presentation">
              {withExperiences.length ? 'Otras ciudades' : 'Ciudades'}
            </li>
          )}
          {others.map((city, index) => renderOption(city, withExperiences.length + index))}
        </ul>
      )}
    </div>
  )
}

export default CityField

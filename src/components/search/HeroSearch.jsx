import { useEffect, useRef, useState } from 'react'
import { Building2, Clock, LoaderCircle, MapPin, Navigation, Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cities } from '../../data/cities'
import { useRecentSearches } from '../../hooks/useRecentSearches'
import { getDatePresets } from '../../utils/catalogFilters'
import { formatShortDate, normalizeText, pluralize } from '../../utils/format'
import { describeGuests, GUEST_TYPES, MAX_GUESTS } from '../../utils/guests'
import { findNearestCity } from '../../utils/location'
import Chip from '../ui/Chip'
import DateRangeCalendar from '../ui/DateRangeCalendar'
import ImageWithFallback from '../ui/ImageWithFallback'
import QuantityStepper from '../ui/QuantityStepper'
import './HeroSearch.css'

// Más lejos que esto, "Cerca tuyo" avisa que no hay experiencias en tu zona
const NEARBY_KM = 150
const MAX_EXPERIENCE_SUGGESTIONS = 3

const shortDate = (value) => formatShortDate(`${value}T12:00:00`)

function describeDates({ dateFrom, dateTo }) {
  if (!dateFrom && !dateTo) return ''
  if (dateFrom === dateTo) return shortDate(dateFrom)
  if (!dateTo) return `Desde ${shortDate(dateFrom)}`
  if (!dateFrom) return `Hasta ${shortDate(dateTo)}`
  return `${shortDate(dateFrom)} – ${shortDate(dateTo)}`
}

/** Texto de ayuda debajo del calendario según lo que falta elegir. */
function datesHint({ dateFrom, dateTo }) {
  if (!dateFrom) return 'Elegí un día o un rango de fechas.'
  if (!dateTo) return 'Ahora elegí hasta cuándo, o buscá desde ese día.'
  return describeDates({ dateFrom, dateTo })
}

const toDraft = (value) => ({
  location: value.location ?? '',
  dateFrom: value.dateFrom ?? '',
  dateTo: value.dateTo ?? '',
  adults: value.adults ?? 0,
  children: value.children ?? 0,
  infants: value.infants ?? 0,
})

const sameSearch = (a, b) => ['location', 'dateFrom', 'dateTo', 'adults', 'children', 'infants'].every((key) => a[key] === b[key])

/** Botón "×" para vaciar un campo del buscador (aparece solo si tiene algo). */
function ClearButton({ label, onClick }) {
  return (
    <button type="button" className="hero-search__clear" aria-label={label} onClick={onClick}>
      <X size={14} aria-hidden />
    </button>
  )
}

/**
 * Buscador principal: Lugar · Fechas · Viajeros. Todo es opcional: se puede buscar
 * solo por lugar (o sin nada). `destinations` son las ciudades que tienen experiencias;
 * `availableDates`, los días con alguna fecha con lugar (se marcan en el calendario).
 * Al escribir en Lugar también sugiere `experiences` por nombre, que llevan directo al detalle.
 * `autoFocus` abre el buscador ya en Lugar (lo usa la versión del navbar).
 */
function HeroSearch({ id, value, destinations, availableDates, experiences = [], autoFocus = false, onSearch }) {
  const navigate = useNavigate()
  const [draft, setDraft] = useState(() => toDraft(value))
  const [open, setOpen] = useState(autoFocus ? 'lugar' : null) // 'lugar' | 'fechas' | 'viajeros' | null
  const [nearby, setNearby] = useState({ status: 'idle', message: '' })
  const { recent, add } = useRecentSearches()
  const rootRef = useRef(null)

  // Si la URL cambia desde afuera (quitar un chip, limpiar filtros), el borrador se resincroniza
  const [synced, setSynced] = useState(() => toDraft(value))
  if (!sameSearch(synced, toDraft(value))) {
    setSynced(toDraft(value))
    setDraft(toDraft(value))
  }

  useEffect(() => {
    if (!open) return undefined
    const close = (event) => {
      if (event.type === 'keydown' ? event.key === 'Escape' : !rootRef.current?.contains(event.target)) setOpen(null)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  const update = (patch) => setDraft((current) => ({ ...current, ...patch }))

  // Con niños o bebés tiene que ir al menos un adulto
  const updateGuests = (type, count) =>
    setDraft((current) => {
      const next = { ...current, [type]: count }
      if (type !== 'adults' && count > 0 && !next.adults) next.adults = 1
      if (type === 'adults' && count === 0) {
        next.children = 0
        next.infants = 0
      }
      return next
    })

  const submit = (next = draft) => {
    setOpen(null)
    const search = { ...next, location: next.location.trim() }
    add(search)
    // Los ceros se mandan como null para que no queden en la URL
    onSearch({ ...search, adults: search.adults || null, children: search.children || null, infants: search.infants || null })
  }

  const pickPlace = (location) => {
    setDraft((current) => ({ ...current, location }))
    setOpen('fechas')
  }

  // Geolocalización del navegador: no usa ninguna API externa
  const searchNearby = () => {
    if (!navigator.geolocation) {
      setNearby({ status: 'error', message: 'Tu navegador no permite ubicarte.' })
      return
    }
    setNearby({ status: 'loading', message: '' })
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const point = { lat: coords.latitude, lng: coords.longitude }
        const withExperiences = cities.filter((city) => destinations.some((entry) => entry.name === city.name))
        const nearest = findNearestCity(point, withExperiences.length ? withExperiences : cities)
        if (!nearest || nearest.distance > NEARBY_KM) {
          const closest = findNearestCity(point, cities)
          setNearby({
            status: 'error',
            message: `Todavía no hay experiencias cerca tuyo${closest ? ` (estás cerca de ${closest.city.name})` : ''}.`,
          })
          return
        }
        setNearby({ status: 'idle', message: '' })
        pickPlace(nearest.city.name)
      },
      (error) =>
        setNearby({
          status: 'error',
          message: error.code === error.PERMISSION_DENIED ? 'No diste permiso para usar tu ubicación.' : 'No pudimos obtener tu ubicación.',
        }),
      { timeout: 10000, maximumAge: 600000 },
    )
  }

  const typed = normalizeText(draft.location.trim())
  const known = [
    ...destinations,
    ...cities.filter((city) => !destinations.some((entry) => entry.name === city.name)).map((city) => ({ ...city, count: 0 })),
  ]
  const matchingExperiences = typed
    ? experiences
        .filter((experience) => normalizeText(`${experience.title} ${experience.subtitle}`).includes(typed))
        .slice(0, MAX_EXPERIENCE_SUGGESTIONS)
    : []
  const suggestions = typed
    ? known.filter((city) => normalizeText(`${city.name} ${city.country ?? ''}`).includes(typed)).slice(0, 6)
    : destinations
  const presets = getDatePresets()
  const activePreset = presets.find((preset) => preset.dateFrom === draft.dateFrom && preset.dateTo === draft.dateTo)
  const hasDates = Boolean(draft.dateFrom || draft.dateTo)
  const guestsText = describeGuests(draft)
  const totalGuests = draft.adults + draft.children + draft.infants

  return (
    <form
      id={id}
      ref={rootRef}
      className={`hero-search ${open ? 'is-open' : ''}`}
      role="search"
      aria-label="Buscar experiencias"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      {/* Lugar */}
      <div className={`hero-search__segment ${open === 'lugar' ? 'is-active' : ''}`}>
        <label className="hero-search__field">
          <span className="hero-search__label">Lugar</span>
          <input
            type="search"
            value={draft.location}
            placeholder="Ciudad, barrio o experiencia"
            autoComplete="off"
            autoFocus={autoFocus}
            onFocus={() => setOpen('lugar')}
            onChange={(event) => {
              update({ location: event.target.value })
              setOpen('lugar')
            }}
          />
        </label>
        {draft.location && <ClearButton label="Borrar lugar" onClick={() => update({ location: '' })} />}
        {open === 'lugar' && (
          <div className="hero-search__popover hero-search__popover--places">
            <button type="button" className="place-option" onClick={searchNearby} disabled={nearby.status === 'loading'}>
              <span className="place-option__icon place-option__icon--nearby">
                {nearby.status === 'loading' ? <LoaderCircle size={22} className="spin" aria-hidden /> : <Navigation size={22} aria-hidden />}
              </span>
              <span>
                <strong>Cerca tuyo</strong>
                <small>{nearby.status === 'loading' ? 'Buscando tu ubicación…' : 'Descubrí qué hay para hacer donde estás'}</small>
              </span>
            </button>
            {nearby.status === 'error' && <p className="hero-search__note">{nearby.message}</p>}

            {!typed && recent.length > 0 && (
              <>
                <p className="hero-search__group">Búsquedas recientes</p>
                {recent.map((search) => (
                  <button
                    key={search.location}
                    type="button"
                    className="place-option"
                    onClick={() => {
                      const next = toDraft(search)
                      setDraft(next)
                      submit(next)
                    }}
                  >
                    <span className="place-option__icon">
                      <Clock size={22} aria-hidden />
                    </span>
                    <span>
                      <strong>{search.location}</strong>
                      <small>{[describeDates(search) || 'Cualquier fecha', describeGuests(toDraft(search))].filter(Boolean).join(' · ')}</small>
                    </span>
                  </button>
                ))}
              </>
            )}

            {matchingExperiences.length > 0 && (
              <>
                <p className="hero-search__group">Experiencias</p>
                {matchingExperiences.map((experience) => (
                  <button
                    key={experience.id}
                    type="button"
                    className="place-option"
                    onClick={() => {
                      setOpen(null)
                      navigate(`/experiencias/${experience.id}`)
                    }}
                  >
                    <ImageWithFallback src={experience.images[0]} alt="" className="place-option__icon place-option__thumb" />
                    <span>
                      <strong>{experience.title}</strong>
                      <small>{experience.location}</small>
                    </span>
                  </button>
                ))}
              </>
            )}

            <p className="hero-search__group">{typed ? 'Destinos' : 'Destinos con experiencias'}</p>
            {suggestions.length ? (
              suggestions.map((city) => (
                <button key={city.name} type="button" className="place-option" onClick={() => pickPlace(city.name)}>
                  <span className="place-option__icon">
                    {city.count ? <Building2 size={22} aria-hidden /> : <MapPin size={22} aria-hidden />}
                  </span>
                  <span>
                    <strong>{city.name}</strong>
                    <small>
                      {[city.country, city.count ? pluralize(city.count, 'experiencia') : 'Próximamente'].filter(Boolean).join(' · ')}
                    </small>
                  </span>
                </button>
              ))
            ) : (
              <p className="hero-search__note">Apretá Buscar para ver planes en “{draft.location.trim()}”.</p>
            )}
          </div>
        )}
      </div>

      {/* Fechas */}
      <div className={`hero-search__segment ${open === 'fechas' ? 'is-active' : ''}`}>
        <button type="button" className="hero-search__field" aria-expanded={open === 'fechas'} onClick={() => setOpen(open === 'fechas' ? null : 'fechas')}>
          <span className="hero-search__label">Fechas</span>
          <span className={hasDates ? 'hero-search__value' : 'hero-search__placeholder'}>{describeDates(draft) || 'Cualquier fecha'}</span>
        </button>
        {hasDates && <ClearButton label="Borrar fechas" onClick={() => update({ dateFrom: '', dateTo: '' })} />}
        {open === 'fechas' && (
          <div className="hero-search__popover hero-search__popover--dates">
            <div className="hero-search__presets" role="group" aria-label="Atajos de fecha">
              {presets.map((preset) => (
                <Chip
                  key={preset.id}
                  selected={activePreset?.id === preset.id}
                  onClick={() =>
                    update(
                      activePreset?.id === preset.id
                        ? { dateFrom: '', dateTo: '' }
                        : { dateFrom: preset.dateFrom, dateTo: preset.dateTo },
                    )
                  }
                >
                  {preset.label}
                </Chip>
              ))}
            </div>
            <DateRangeCalendar dateFrom={draft.dateFrom} dateTo={draft.dateTo} markedDates={availableDates} onChange={update} />
            <p className="hero-search__dates-footer" aria-live="polite">
              <span>{datesHint(draft)}</span>
              {availableDates?.size > 0 && (
                <span className="hero-search__legend">
                  <i aria-hidden /> Días con planes
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Viajeros */}
      <div className={`hero-search__segment ${open === 'viajeros' ? 'is-active' : ''}`}>
        <button
          type="button"
          className="hero-search__field"
          aria-expanded={open === 'viajeros'}
          onClick={() => setOpen(open === 'viajeros' ? null : 'viajeros')}
        >
          <span className="hero-search__label">Viajeros</span>
          <span className={guestsText ? 'hero-search__value' : 'hero-search__placeholder'}>{guestsText || '¿Cuántos van?'}</span>
        </button>
        {totalGuests > 0 && <ClearButton label="Borrar viajeros" onClick={() => update({ adults: 0, children: 0, infants: 0 })} />}
        {open === 'viajeros' && (
          <div className="hero-search__popover hero-search__popover--right">
            <ul className="hero-search__guests">
              {GUEST_TYPES.map((type) => (
                <li key={type.id}>
                  <span>
                    <strong>{type.label}</strong>
                    <small>{type.detail}</small>
                  </span>
                  <QuantityStepper
                    label={type.label}
                    value={draft[type.id]}
                    min={0}
                    max={type.id === 'infants' ? MAX_GUESTS : MAX_GUESTS - (type.id === 'adults' ? draft.children : draft.adults)}
                    onChange={(count) => updateGuests(type.id, count)}
                  />
                </li>
              ))}
            </ul>
            <p className="hero-search__note">Algunas experiencias tienen edad mínima: con niños o bebés te mostramos solo las que los admiten.</p>
          </div>
        )}
      </div>

      <button type="submit" className="hero-search__submit">
        <Search size={20} aria-hidden />
        <span>Buscar</span>
      </button>
    </form>
  )
}

export default HeroSearch

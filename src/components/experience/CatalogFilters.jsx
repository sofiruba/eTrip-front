import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { DURATION_STEPS, SORT_OPTIONS, TIME_SLOTS } from '../../utils/catalogFilters'
import { formatShortDate } from '../../utils/format'
import { describeGuests } from '../../utils/guests'
import { useCurrency } from '../../hooks/useCurrency'
import Button from '../ui/Button'
import RangeSlider from '../ui/RangeSlider'
import PriceFilter from './PriceFilter'
import './CatalogFilters.css'

const shortDate = (value) => formatShortDate(`${value}T12:00:00`)
const LAST_STEP = DURATION_STEPS.length - 1
const durationLabel = (minutes) => DURATION_STEPS.find((step) => step.minutes === minutes)?.label ?? `${minutes} min`

/** Posición en los escalones de duración de un valor en minutos (null = punta del slider). */
const toStepIndex = (minutes, fallback) => {
  if (minutes == null) return fallback
  const index = DURATION_STEPS.findIndex((step) => step.minutes >= minutes)
  return index === -1 ? LAST_STEP : index
}

/** Lista de filtros activos como chips que se pueden quitar de a uno. */
function getActiveFilters(filters, categories, formatMoney) {
  const active = []
  const { title, categoryId, location, minPrice, maxPrice, onlyDiscounted, dateFrom, dateTo, guests, onlyAvailable } = filters
  if (location) active.push({ id: 'location', label: location, clear: { location: '' } })
  if (title) active.push({ id: 'title', label: `“${title}”`, clear: { title: '' } })
  if (categoryId) {
    const name = categories.find((category) => category.id === categoryId)?.name ?? 'Categoría'
    active.push({ id: 'categoryId', label: name, clear: { categoryId: null } })
  }
  if (dateFrom || dateTo) {
    const label =
      dateFrom === dateTo
        ? shortDate(dateFrom)
        : `${dateFrom ? shortDate(dateFrom) : '…'} – ${dateTo ? shortDate(dateTo) : '…'}`
    active.push({ id: 'dates', label, clear: { dateFrom: '', dateTo: '' } })
  }
  if (guests || filters.infants) {
    active.push({ id: 'guests', label: describeGuests(filters), clear: { adults: null, children: null, infants: null } })
  }
  if (minPrice != null || maxPrice != null) {
    const label =
      minPrice != null && maxPrice != null
        ? `${formatMoney(minPrice)} – ${formatMoney(maxPrice)}`
        : minPrice != null
          ? `Desde ${formatMoney(minPrice)}`
          : `Hasta ${formatMoney(maxPrice)}`
    active.push({ id: 'price', label, clear: { minPrice: null, maxPrice: null } })
  }
  const { durationMin, durationMax, times } = filters
  if (durationMin != null || durationMax != null) {
    const label =
      durationMin != null && durationMax != null
        ? `${durationLabel(durationMin)} – ${durationLabel(durationMax)}`
        : durationMin != null
          ? durationMin === DURATION_STEPS[LAST_STEP].minutes
            ? durationLabel(durationMin) // "5 h o más", no "Desde 5 h o más"
            : `Desde ${durationLabel(durationMin)}`
          : `Hasta ${durationLabel(durationMax)}`
    active.push({ id: 'duration', label, clear: { durationMin: null, durationMax: null } })
  }
  if (times.length) {
    const label = TIME_SLOTS.filter((slot) => times.includes(slot.id))
      .map((slot) => slot.label)
      .join(', ')
    active.push({ id: 'times', label, clear: { times: [] } })
  }
  if (onlyDiscounted) active.push({ id: 'onlyDiscounted', label: 'En oferta', clear: { onlyDiscounted: false } })
  if (onlyAvailable) active.push({ id: 'onlyAvailable', label: 'Con lugares', clear: { onlyAvailable: false } })
  return active
}

/**
 * Barra de filtros del catálogo: orden, panel de filtros (precio, duración, horario y opciones) y chips de filtros activos.
 * Lugar, fechas y personas se eligen en el buscador principal.
 * `prices`: precios finales de todo el catálogo, para el histograma del filtro de precio.
 */
function CatalogFilters({ filters, categories, prices, resultCount, onChange, onClear }) {
  const [open, setOpen] = useState(false)

  // Duración: el slider se mueve por escalones (índices de DURATION_STEPS) y se aplica al soltar
  const durationFromFilters = () => [toStepIndex(filters.durationMin, 0), toStepIndex(filters.durationMax, LAST_STEP)]
  const [duration, setDuration] = useState(durationFromFilters)
  const [syncedDuration, setSyncedDuration] = useState([filters.durationMin, filters.durationMax])
  // Si la duración cambia desde afuera (quitar el chip, "Limpiar todo"), se vuelve a sincronizar
  if (syncedDuration[0] !== filters.durationMin || syncedDuration[1] !== filters.durationMax) {
    setSyncedDuration([filters.durationMin, filters.durationMax])
    setDuration(durationFromFilters())
  }
  const commitDuration = () => {
    const [from, to] = duration
    const patch = {
      durationMin: from === 0 ? null : DURATION_STEPS[from].minutes,
      durationMax: to === LAST_STEP ? null : DURATION_STEPS[to].minutes,
    }
    if (patch.durationMin !== filters.durationMin || patch.durationMax !== filters.durationMax) onChange(patch)
  }

  const toggleTime = (id) =>
    onChange({ times: filters.times.includes(id) ? filters.times.filter((time) => time !== id) : [...filters.times, id] })

  const { format } = useCurrency()
  const active = getActiveFilters(filters, categories, format)
  // El contador es solo de lo que se elige en el panel
  const panelCount = active.filter((filter) =>
    ['price', 'duration', 'times', 'onlyDiscounted', 'onlyAvailable'].includes(filter.id),
  ).length

  return (
    <div className="catalog-filters">
      <div className="catalog-filters__bar">
        <Button
          variant="secondary"
          size="sm"
          icon={SlidersHorizontal}
          aria-expanded={open}
          aria-controls="catalog-filters-panel"
          onClick={() => setOpen(!open)}
        >
          Filtros
          {panelCount > 0 && <span className="catalog-filters__count">{panelCount}</span>}
        </Button>
        <span className="muted small catalog-filters__results" aria-live="polite">
          {resultCount === 1 ? '1 experiencia' : `${resultCount} experiencias`}
        </span>
        <label className="catalog-filters__sort">
          <span className="muted small">Ordenar por</span>
          <select value={filters.sort} onChange={(event) => onChange({ sort: event.target.value })}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {open && (
        <div className="catalog-filters__panel card" id="catalog-filters-panel">
          <div className="catalog-filters__column">
            <fieldset>
              <legend>Precio por persona</legend>
              <PriceFilter prices={prices} minPrice={filters.minPrice} maxPrice={filters.maxPrice} onChange={onChange} />
            </fieldset>

            <fieldset>
              <legend>Duración</legend>
              <RangeSlider
                min={0}
                max={LAST_STEP}
                value={duration}
                onChange={setDuration}
                onCommit={commitDuration}
                labels={['Duración mínima', 'Duración máxima']}
                formatValue={(index) => DURATION_STEPS[index].label}
              />
              <ol className="catalog-filters__ticks" aria-hidden>
                {DURATION_STEPS.map((step, index) => (
                  <li key={step.minutes} style={{ '--at': index / LAST_STEP }}>
                    {step.label}
                  </li>
                ))}
              </ol>
            </fieldset>
          </div>

          <div className="catalog-filters__column">
            <fieldset>
              <legend>Horario</legend>
              {TIME_SLOTS.map((slot) => (
                <label key={slot.id} className="checkbox catalog-filters__time">
                  <input type="checkbox" checked={filters.times.includes(slot.id)} onChange={() => toggleTime(slot.id)} />
                  <span>
                    {slot.label}
                    <small className="muted">{slot.hint}</small>
                  </span>
                </label>
              ))}
            </fieldset>

            <fieldset>
              <legend>Mostrar</legend>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={filters.onlyAvailable}
                  onChange={(event) => onChange({ onlyAvailable: event.target.checked })}
                />
                Solo con lugares disponibles
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={filters.onlyDiscounted}
                  onChange={(event) => onChange({ onlyDiscounted: event.target.checked })}
                />
                Solo ofertas
              </label>
            </fieldset>
          </div>
        </div>
      )}

      {active.length > 0 && (
        <div className="catalog-filters__active" role="group" aria-label="Filtros aplicados">
          {active.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className="active-filter"
              aria-label={`Quitar filtro ${filter.label}`}
              onClick={() => onChange(filter.clear)}
            >
              {filter.label}
              <X size={14} aria-hidden />
            </button>
          ))}
          <button type="button" className="catalog-filters__clear" onClick={onClear}>
            Limpiar todo
          </button>
        </div>
      )}
    </div>
  )
}

export default CatalogFilters

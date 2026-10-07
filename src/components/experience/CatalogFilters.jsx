import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { SORT_OPTIONS } from '../../utils/catalogFilters'
import { formatMoney, formatShortDate } from '../../utils/format'
import { describeGuests } from '../../utils/guests'
import Button from '../ui/Button'
import './CatalogFilters.css'

const shortDate = (value) => formatShortDate(`${value}T12:00:00`)

/** Lista de filtros activos como chips que se pueden quitar de a uno. */
function getActiveFilters(filters, categories) {
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
  if (onlyDiscounted) active.push({ id: 'onlyDiscounted', label: 'En oferta', clear: { onlyDiscounted: false } })
  if (onlyAvailable) active.push({ id: 'onlyAvailable', label: 'Con lugares', clear: { onlyAvailable: false } })
  return active
}

/**
 * Barra de filtros del catálogo: orden, panel de filtros (precio y opciones) y chips de filtros activos.
 * Lugar, fechas y personas se eligen en el buscador principal.
 */
function CatalogFilters({ filters, categories, resultCount, onChange, onClear }) {
  const [open, setOpen] = useState(false)
  const [price, setPrice] = useState({ min: filters.minPrice ?? '', max: filters.maxPrice ?? '' })
  const [syncedPrice, setSyncedPrice] = useState([filters.minPrice, filters.maxPrice])
  // Si el precio cambia desde afuera (quitar chip, limpiar), se resincronizan los inputs
  if (syncedPrice[0] !== filters.minPrice || syncedPrice[1] !== filters.maxPrice) {
    setSyncedPrice([filters.minPrice, filters.maxPrice])
    setPrice({ min: filters.minPrice ?? '', max: filters.maxPrice ?? '' })
  }

  const active = getActiveFilters(filters, categories)
  // El contador es solo de lo que se elige en el panel
  const panelCount = active.filter((filter) => ['price', 'onlyDiscounted', 'onlyAvailable'].includes(filter.id)).length

  const applyPrice = (event) => {
    event?.preventDefault()
    let min = price.min === '' ? null : Math.max(Number(price.min), 0)
    let max = price.max === '' ? null : Math.max(Number(price.max), 0)
    if (min != null && max != null && min > max) [min, max] = [max, min]
    if (min !== filters.minPrice || max !== filters.maxPrice) onChange({ minPrice: min, maxPrice: max })
  }

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
          <fieldset>
            <legend>Precio por persona</legend>
            <form className="catalog-filters__pair" onSubmit={applyPrice}>
              <label>
                <span>Mínimo</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  inputMode="numeric"
                  placeholder="$ 0"
                  value={price.min}
                  onChange={(event) => setPrice({ ...price, min: event.target.value })}
                  onBlur={applyPrice}
                />
              </label>
              <label>
                <span>Máximo</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  inputMode="numeric"
                  placeholder="Sin tope"
                  value={price.max}
                  onChange={(event) => setPrice({ ...price, max: event.target.value })}
                  onBlur={applyPrice}
                />
              </label>
              <button type="submit" hidden>
                Aplicar
              </button>
            </form>
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

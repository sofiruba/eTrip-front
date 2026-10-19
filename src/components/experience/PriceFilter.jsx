import { useState } from 'react'
import { useCurrency } from '../../hooks/useCurrency'
import RangeSlider from '../ui/RangeSlider'
import './PriceFilter.css'

const BINS = 24

/** Tope del slider: el precio más caro del catálogo, redondeado para arriba a miles. */
const getTop = (prices) => Math.max(1000, Math.ceil(Math.max(0, ...prices) / 1000) * 1000)

/**
 * Precio por persona estilo Airbnb: histograma con cuántas experiencias hay en cada franja de precio,
 * slider de dos manijas y los campos Mínimo / Máximo. Los precios son los finales (con descuento)
 * del catálogo que ya está cargado: no hace ningún pedido al back.
 * Todo se calcula en pesos (como viene del back y como queda en la URL); los textos y los campos se ven y se
 * escriben en la moneda que eligió el usuario, y lo que escribe se pasa a pesos.
 */
function PriceFilter({ prices, minPrice, maxPrice, onChange }) {
  const { currency, symbol, format, fromArs, toArs } = useCurrency()
  const inPesos = currency.code === 'ARS'
  const top = getTop(prices)
  const step = Math.max(100, Math.round(top / 100 / 100) * 100)
  const fromFilters = () => [minPrice ?? 0, Math.min(maxPrice ?? top, top)]

  const [draft, setDraft] = useState(fromFilters)
  const [synced, setSynced] = useState([minPrice, maxPrice, top])
  // Si el precio cambia desde afuera (quitar el chip, "Limpiar todo") o cambia el catálogo, se vuelve a sincronizar
  if (synced[0] !== minPrice || synced[1] !== maxPrice || synced[2] !== top) {
    setSynced([minPrice, maxPrice, top])
    setDraft(fromFilters())
  }
  const [low, high] = draft

  // En las puntas no hay filtro: $0 = sin mínimo y el tope = sin máximo
  const commit = ([from, to] = draft) => {
    let next = [Math.max(0, from), Math.max(0, to)]
    if (next[0] > next[1]) next = [next[1], next[0]]
    const patch = { minPrice: next[0] <= 0 ? null : next[0], maxPrice: next[1] >= top ? null : next[1] }
    setDraft([next[0], Math.min(next[1], top)])
    if (patch.minPrice !== minPrice || patch.maxPrice !== maxPrice) onChange(patch)
  }

  // Histograma: cuántas experiencias caen en cada franja
  const binSize = top / BINS
  const counts = Array.from({ length: BINS }, () => 0)
  prices.forEach((price) => {
    counts[Math.min(BINS - 1, Math.floor(price / binSize))] += 1
  })
  const tallest = Math.max(1, ...counts)

  const formatThumb = (value) => (value >= top ? `${format(top)} o más` : format(value))
  // Valor del campo en la moneda elegida (entero)
  const shown = (ars) => Math.round(fromArs(ars))

  return (
    <div className="price-filter">
      {prices.length > 0 && (
        <>
          <div className="price-filter__histogram" aria-hidden>
            {counts.map((count, index) => {
              const center = (index + 0.5) * binSize
              return (
                <span
                  key={index}
                  className={`price-filter__bar ${center >= low && center <= high ? 'is-in' : ''}`}
                  style={{ height: count ? `${Math.max(6, (count / tallest) * 100)}%` : '2px' }}
                />
              )
            })}
          </div>
          <RangeSlider
            min={0}
            max={top}
            step={step}
            value={draft}
            onChange={setDraft}
            onCommit={() => commit()}
            labels={['Precio mínimo', 'Precio máximo']}
            formatValue={formatThumb}
          />
        </>
      )}

      <form
        className="price-filter__inputs"
        onSubmit={(event) => {
          event.preventDefault()
          commit()
        }}
      >
        <label>
          <span>Mínimo{inPesos ? '' : ` (${currency.code})`}</span>
          <input
            type="number"
            min="0"
            step={inPesos ? step : 1}
            inputMode="numeric"
            placeholder={`${symbol} 0`}
            value={low > 0 ? shown(low) : ''}
            onChange={(event) => setDraft([event.target.value === '' ? 0 : toArs(event.target.value), high])}
            onBlur={() => commit()}
          />
        </label>
        <label>
          <span>Máximo{inPesos ? '' : ` (${currency.code})`}</span>
          <input
            type="number"
            min="0"
            step={inPesos ? step : 1}
            inputMode="numeric"
            placeholder={prices.length ? `${format(top)}+` : 'Sin tope'}
            value={high < top ? shown(high) : ''}
            onChange={(event) => setDraft([low, event.target.value === '' ? top : toArs(event.target.value)])}
            onBlur={() => commit()}
          />
        </label>
        <button type="submit" hidden>
          Aplicar
        </button>
      </form>
    </div>
  )
}

export default PriceFilter

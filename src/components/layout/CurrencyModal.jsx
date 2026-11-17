import { useDispatch } from 'react-redux'
import { useCurrency } from '../../hooks/useCurrency'
import { setCurrency } from '../../redux/preferencesSlice'
import { formatFullDate } from '../../utils/format'
import Modal from '../ui/Modal'
import './CurrencyModal.css'

/** "Elegí una moneda" (estilo Airbnb). Solo cambia cómo se ven los precios: se cobra siempre en pesos. */
function CurrencyModal({ onClose }) {
  const dispatch = useDispatch()
  const { currency, currencies } = useCurrency()
  // Fecha de la última cotización que cargó el admin (viene del back)
  const lastUpdate = currencies.map((entry) => entry.updatedAt).sort().at(-1)

  return (
    <Modal title="Elegí una moneda" onClose={onClose} size="lg">
      <ul className="currency-grid" aria-label="Monedas">
        {currencies.map((entry) => {
          const selected = entry.code === currency.code
          return (
            <li key={entry.code}>
              <button
                type="button"
                className={`currency-option ${selected ? 'is-selected' : ''}`}
                aria-pressed={selected}
                onClick={() => {
                  dispatch(setCurrency(entry.code))
                  onClose()
                }}
              >
                <strong>{entry.name}</strong>
                <span className="muted">
                  {entry.code} – {entry.symbol}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="currency-note muted small">
        Los precios se cobran en pesos argentinos. En otra moneda vas a ver un valor aproximado
        {lastUpdate && `, con la cotización de referencia del ${formatFullDate(lastUpdate)}`}.
      </p>
    </Modal>
  )
}

export default CurrencyModal

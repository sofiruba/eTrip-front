import { RATES_DATE } from '../../data/currencies'
import { useCurrency } from '../../hooks/useCurrency'
import Modal from '../ui/Modal'
import './CurrencyModal.css'

const RATES_LABEL = new Date(`${RATES_DATE}T12:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })

/** "Elegí una moneda" (estilo Airbnb). Solo cambia cómo se ven los precios: se cobra siempre en pesos. */
function CurrencyModal({ onClose }) {
  const { currency, currencies, setCurrency } = useCurrency()

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
                  setCurrency(entry.code)
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
        Los precios se cobran en pesos argentinos. En otra moneda vas a ver un valor aproximado, con la cotización de
        referencia del {RATES_LABEL}.
      </p>
    </Modal>
  )
}

export default CurrencyModal

import { Lock } from 'lucide-react'
import { CARD_BRANDS, detectBrand, formatCardNumber, formatExpiry, onlyDigits } from '../../utils/cards'
import CardBrandIcon from './CardBrandIcon'
import { COUNTRIES } from './paymentOptions'
import './CardForm.css'

const FIELD_ORDER = ['number', 'expiry', 'cvv', 'holder', 'postalCode']

/**
 * Formulario de tarjeta controlado por el checkout.
 * `errors` trae solo los errores que ya hay que mostrar (campo tocado o intento de pago).
 */
function CardForm({ card, errors, onChange, onBlur }) {
  const brand = detectBrand(card.number)
  const cvvSize = brand ? CARD_BRANDS[brand].cvv : 3
  const visibleErrors = FIELD_ORDER.filter((field) => errors[field])

  const cell = (field) => ({
    id: `card-${field}`,
    name: field,
    'aria-invalid': Boolean(errors[field]),
    'aria-describedby': errors[field] ? `card-${field}-error` : undefined,
    onBlur: () => onBlur(field),
  })

  return (
    <div className="card-form">
      <div className="card-form__group">
        <label className={`card-form__cell card-form__cell--full ${errors.number ? 'is-invalid' : ''}`} htmlFor="card-number">
          <span className="card-form__label">
            Número de tarjeta <Lock size={12} aria-hidden />
          </span>
          <input
            {...cell('number')}
            value={card.number}
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="1234 1234 1234 1234"
            onChange={(event) => onChange({ number: formatCardNumber(event.target.value) })}
          />
          {brand && (
            <span className="card-form__brand">
              <CardBrandIcon brand={brand} />
            </span>
          )}
        </label>
        <label className={`card-form__cell ${errors.expiry ? 'is-invalid' : ''}`} htmlFor="card-expiry">
          <span className="card-form__label">Vencimiento</span>
          <input
            {...cell('expiry')}
            value={card.expiry}
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/AA"
            maxLength={5}
            onChange={(event) => onChange({ expiry: formatExpiry(event.target.value, card.expiry) })}
          />
        </label>
        <label className={`card-form__cell ${errors.cvv ? 'is-invalid' : ''}`} htmlFor="card-cvv">
          <span className="card-form__label">CVV</span>
          <input
            {...cell('cvv')}
            value={card.cvv}
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder={'•'.repeat(cvvSize)}
            maxLength={cvvSize}
            onChange={(event) => onChange({ cvv: onlyDigits(event.target.value).slice(0, cvvSize) })}
          />
        </label>
      </div>

      <div className="card-form__group">
        <label className={`card-form__cell card-form__cell--full ${errors.holder ? 'is-invalid' : ''}`} htmlFor="card-holder">
          <span className="card-form__label">Nombre del titular</span>
          <input
            {...cell('holder')}
            value={card.holder}
            autoComplete="cc-name"
            placeholder="Como figura en la tarjeta"
            onChange={(event) => onChange({ holder: event.target.value })}
          />
        </label>
      </div>

      <div className="card-form__group">
        <label className={`card-form__cell ${errors.postalCode ? 'is-invalid' : ''}`} htmlFor="card-postalCode">
          <span className="card-form__label">Código postal</span>
          <input
            {...cell('postalCode')}
            value={card.postalCode}
            autoComplete="postal-code"
            placeholder={card.country === 'AR' ? 'C1425ABC' : ''}
            maxLength={10}
            onChange={(event) => onChange({ postalCode: event.target.value.toUpperCase() })}
          />
        </label>
        <label className="card-form__cell" htmlFor="card-country">
          <span className="card-form__label">País/región</span>
          <select
            id="card-country"
            value={card.country}
            autoComplete="country"
            onChange={(event) => onChange({ country: event.target.value })}
          >
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visibleErrors.length > 0 && (
        <ul className="card-form__errors">
          {visibleErrors.map((field) => (
            <li key={field} id={`card-${field}-error`}>
              {errors[field]}
            </li>
          ))}
        </ul>
      )}

      <label className="checkbox card-form__save">
        <input type="checkbox" checked={card.save} onChange={(event) => onChange({ save: event.target.checked })} />
        Guardar esta tarjeta para próximos pagos
      </label>
    </div>
  )
}

export default CardForm

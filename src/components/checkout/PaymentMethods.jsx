import { CreditCard } from 'lucide-react'
import { ACCEPTED_BRANDS, cardExpiry, cardLabel, detectBrand, isCardExpired } from '../../utils/cards'
import CardBrandIcon, { CardBrandList } from './CardBrandIcon'
import CardForm from './CardForm'
import { WALLETS } from './paymentOptions'
import './PaymentMethods.css'

/**
 * Lista de métodos de pago tipo radio.
 * method: 'saved:<id>' | 'card' | id de billetera.
 */
function PaymentMethods({ method, onMethodChange, savedCards, card, cardErrors, onCardChange, onCardBlur }) {
  const option = (value, content, extra) => (
    <li key={value} className={`pay-option ${method === value ? 'is-selected' : ''}`}>
      <label className="pay-option__row">
        {content}
        <input
          type="radio"
          name="payment-method"
          value={value}
          checked={method === value}
          onChange={() => onMethodChange(value)}
          className="pay-option__radio"
        />
      </label>
      {extra}
    </li>
  )

  return (
    <fieldset className="pay-methods">
      <legend className="visually-hidden">Método de pago</legend>
      <ul>
        {savedCards.map((saved) => {
          const expired = isCardExpired(saved)
          return (
            <li key={saved.id} className={`pay-option ${method === `saved:${saved.id}` ? 'is-selected' : ''}`}>
              <label className={`pay-option__row ${expired ? 'is-disabled' : ''}`}>
                <span className="pay-option__icon">
                  <CardBrandIcon brand={saved.brand} />
                </span>
                <span className="pay-option__text">
                  <strong>{cardLabel(saved)}</strong>
                  <small className={expired ? 'pay-option__expired' : ''}>
                    {expired ? 'Vencida' : `Vence ${cardExpiry(saved)}`} · {saved.holder}
                  </small>
                </span>
                <input
                  type="radio"
                  name="payment-method"
                  value={`saved:${saved.id}`}
                  checked={method === `saved:${saved.id}`}
                  disabled={expired}
                  onChange={() => onMethodChange(`saved:${saved.id}`)}
                  className="pay-option__radio"
                />
              </label>
            </li>
          )
        })}

        {option(
          'card',
          <>
            <span className="pay-option__icon">
              <CreditCard size={22} aria-hidden />
            </span>
            <span className="pay-option__text">
              <strong>{savedCards.length ? 'Otra tarjeta de crédito o débito' : 'Tarjeta de crédito o débito'}</strong>
              <CardBrandList brands={ACCEPTED_BRANDS} active={method === 'card' ? detectBrand(card.number) : null} />
            </span>
          </>,
          method === 'card' && (
            <div className="pay-option__body">
              <CardForm card={card} errors={cardErrors} onChange={onCardChange} onBlur={onCardBlur} />
            </div>
          ),
        )}

        {WALLETS.map((wallet) =>
          option(
            wallet.id,
            <>
              <span className="pay-option__icon">
                <span className={`wallet-logo wallet-logo--${wallet.id}`}>{wallet.logo}</span>
              </span>
              <span className="pay-option__text">
                <strong>{wallet.name}</strong>
                {method === wallet.id && <small>Vas a confirmar el pago con tu cuenta de {wallet.name}.</small>}
              </span>
            </>,
          ),
        )}
      </ul>
    </fieldset>
  )
}

export default PaymentMethods

import { CARD_BRANDS } from '../../utils/cards'
import './CardBrandIcon.css'

/** Logo liviano (sin imágenes) de cada marca de tarjeta. */
const LOGOS = {
  visa: <span className="brand-logo__visa">VISA</span>,
  mastercard: (
    <svg viewBox="0 0 24 16" aria-hidden>
      <circle cx="9" cy="8" r="6" fill="#eb001b" />
      <circle cx="15" cy="8" r="6" fill="#f79e1b" fillOpacity="0.9" />
    </svg>
  ),
  amex: <span className="brand-logo__amex">AMEX</span>,
}

function CardBrandIcon({ brand, dimmed = false }) {
  if (!LOGOS[brand]) return null
  return (
    <span className={`brand-logo brand-logo--${brand} ${dimmed ? 'is-dimmed' : ''}`} title={CARD_BRANDS[brand].name}>
      {LOGOS[brand]}
      <span className="visually-hidden">{CARD_BRANDS[brand].name}</span>
    </span>
  )
}

export function CardBrandList({ brands, active }) {
  return (
    <span className="brand-list">
      {brands.map((brand) => (
        <CardBrandIcon key={brand} brand={brand} dimmed={Boolean(active) && active !== brand} />
      ))}
    </span>
  )
}

export default CardBrandIcon

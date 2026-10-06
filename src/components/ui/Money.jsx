import { formatMoney } from '../../utils/format'

/** Precio formateado. Si hay `original` mayor, lo muestra tachado antes. */
function Money({ value, original }) {
  if (original > value) {
    return (
      <span className="money">
        <s className="muted">{formatMoney(original)}</s> {formatMoney(value)}
      </span>
    )
  }
  return <span className="money">{formatMoney(value)}</span>
}

export default Money

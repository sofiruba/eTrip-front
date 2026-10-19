import { useCurrency } from '../../hooks/useCurrency'
import { formatMoney } from '../../utils/format'

/**
 * Precio formateado en la moneda que eligió el usuario (los precios vienen en pesos).
 * Si hay `original` mayor, lo muestra tachado antes. Con `pesos` se muestra siempre en pesos (paneles de gestión).
 */
function Money({ value, original, pesos = false }) {
  const { format } = useCurrency()
  const show = pesos ? formatMoney : format
  if (original > value) {
    return (
      <span className="money">
        <s className="muted">{show(original)}</s> {show(value)}
      </span>
    )
  }
  return <span className="money">{show(value)}</span>
}

export default Money

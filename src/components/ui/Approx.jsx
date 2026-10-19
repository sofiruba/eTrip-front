import { useCurrency } from '../../hooks/useCurrency'
import './Approx.css'

/** Al lado de un monto en pesos (lo que se cobra): "≈ US$ 20" en la moneda elegida. Si se eligió pesos, no muestra nada. */
function Approx({ value, className = '' }) {
  const { approx } = useCurrency()
  const text = approx(value)
  if (!text) return null
  return <small className={`approx muted ${className}`.trim()}>{text}</small>
}

export default Approx

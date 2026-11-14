import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { CURRENCIES } from '../data/currencies'
import { formatCurrency } from '../utils/format'

/**
 * Moneda en la que el usuario quiere VER los precios. El código elegido vive en el estado global
 * (preferences.currency, persistido con redux-persist); para cambiarla: dispatch(setCurrency('USD')).
 * Los precios vienen del back en pesos y se cobran en pesos: este hook solo arma las funciones para mostrarlos.
 *
 * { currency, symbol, currencies, format, approx, toArs, fromArs }
 * format(ars): el monto en la moneda elegida ("US$ 20"). approx(ars): "≈ US$ 20", o '' si se eligió pesos.
 */
export function useCurrency() {
  const code = useSelector((state) => state.preferences.currency)

  // useMemo: las funciones se arman de nuevo solo si cambia la moneda
  return useMemo(() => {
    const currency = CURRENCIES.find((entry) => entry.code === code) ?? CURRENCIES[0]
    const fromArs = (ars) => Number(ars) / currency.arsPerUnit
    const format = (ars) => formatCurrency(currency, fromArs(ars))
    return {
      currency,
      symbol: currency.symbol,
      currencies: CURRENCIES,
      fromArs,
      // Lo que alguien escribe en la moneda elegida (filtro de precio), llevado a pesos
      toArs: (amount) => Math.round(Number(amount) * currency.arsPerUnit),
      format,
      approx: (ars) => (currency.code === 'ARS' ? '' : `≈ ${format(ars)}`),
    }
  }, [code])
}

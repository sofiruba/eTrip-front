import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { formatCurrency } from '../utils/format'

// Mientras llegan las monedas (o si el back no las tiene), los precios se ven en pesos, que es como se publican
const PESOS = { code: 'ARS', name: 'Peso argentino', symbol: '$', arsPerUnit: 1 }

/**
 * Moneda en la que el usuario quiere VER los precios. El código elegido es una preferencia (preferences.currency,
 * persistida); las monedas y sus cotizaciones vienen del back (slice currencies). Los precios se cobran en pesos:
 * este hook solo arma las funciones para mostrarlos.
 *
 * { currency, symbol, currencies, format, approx, toArs, fromArs }
 * format(ars): el monto en la moneda elegida ("US$ 20"). approx(ars): "≈ US$ 20", o '' si se eligió pesos.
 */
export function useCurrency() {
  const code = useSelector((state) => state.preferences.currency)
  const currencies = useSelector((state) => state.currencies.items)

  return useMemo(() => {
    const currency = currencies.find((entry) => entry.code === code) ?? currencies.find((entry) => entry.code === 'ARS') ?? PESOS
    const fromArs = (ars) => Number(ars) / currency.arsPerUnit
    const format = (ars) => formatCurrency(currency, fromArs(ars))
    return {
      currency,
      symbol: currency.symbol,
      currencies,
      fromArs,
      // Lo que alguien escribe en la moneda elegida (filtro de precio), llevado a pesos
      toArs: (amount) => Math.round(Number(amount) * currency.arsPerUnit),
      format,
      approx: (ars) => (currency.code === 'ARS' ? '' : `≈ ${format(ars)}`),
    }
  }, [code, currencies])
}

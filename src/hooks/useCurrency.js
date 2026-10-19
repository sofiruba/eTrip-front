import { createContext, useContext } from 'react'

export const CurrencyContext = createContext(null)

/**
 * { currency, symbol, currencies, setCurrency, format, approx, toArs, fromArs }
 * format(ars): el monto en la moneda elegida ("US$ 20"). approx(ars): "≈ US$ 20", o '' si se eligió pesos.
 */
export function useCurrency() {
  return useContext(CurrencyContext)
}

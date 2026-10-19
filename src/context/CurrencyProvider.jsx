import { useMemo } from 'react'
import { CURRENCIES } from '../data/currencies'
import { CurrencyContext } from '../hooks/useCurrency'
import { usePersistentState } from '../hooks/usePersistentState'
import { formatCurrency } from '../utils/format'

/**
 * Moneda en la que el usuario quiere VER los precios (se recuerda en este navegador).
 * Los precios vienen del back en pesos y se cobran en pesos: acá solo se convierten para mostrar.
 */
function CurrencyProvider({ children }) {
  const [code, setCode] = usePersistentState('plan:currency', 'ARS')
  const currency = CURRENCIES.find((entry) => entry.code === code) ?? CURRENCIES[0]

  const value = useMemo(() => {
    const fromArs = (ars) => Number(ars) / currency.arsPerUnit
    const format = (ars) => formatCurrency(currency, fromArs(ars))
    return {
      currency,
      symbol: currency.symbol,
      currencies: CURRENCIES,
      setCurrency: setCode,
      fromArs,
      // Lo que alguien escribe en la moneda elegida (filtro de precio), llevado a pesos
      toArs: (amount) => Math.round(Number(amount) * currency.arsPerUnit),
      format,
      approx: (ars) => (currency.code === 'ARS' ? '' : `≈ ${format(ars)}`),
    }
  }, [currency, setCode])

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export default CurrencyProvider

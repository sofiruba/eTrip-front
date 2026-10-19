/**
 * Monedas para VER los precios. En PLAN todo se publica y se cobra en pesos argentinos (así lo guarda el back):
 * elegir otra moneda solo convierte lo que se muestra, como referencia.
 * `symbol` = cómo se escribe delante del monto (fijo acá: el navegador en castellano a veces pone "EUR" en vez de "€").
 * `arsPerUnit` = cuántos pesos vale 1 unidad de esa moneda. Son cotizaciones de referencia que se actualizan
 * a mano (fecha en RATES_DATE); para la 3ra entrega la idea es traerlas del back.
 */
export const RATES_DATE = '2026-10-19'

export const CURRENCIES = [
  { code: 'ARS', name: 'Peso argentino', symbol: '$', arsPerUnit: 1 },
  { code: 'USD', name: 'Dólar estadounidense', symbol: 'US$', arsPerUnit: 1450 },
  { code: 'EUR', name: 'Euro', symbol: '€', arsPerUnit: 1700 },
  { code: 'GBP', name: 'Libra esterlina', symbol: '£', arsPerUnit: 1950 },
  { code: 'CHF', name: 'Franco suizo', symbol: 'CHF', arsPerUnit: 1820 },
  { code: 'BRL', name: 'Real brasileño', symbol: 'R$', arsPerUnit: 270 },
  { code: 'UYU', name: 'Peso uruguayo', symbol: '$U', arsPerUnit: 36 },
  { code: 'CLP', name: 'Peso chileno', symbol: 'CLP$', arsPerUnit: 1.55 },
]

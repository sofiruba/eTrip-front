import { countSeats, getYoungestAge } from './guests'

/**
 * Filtros del catálogo guardados en la URL. Los nombres son los mismos
 * parámetros que recibe GET /experiences del back, así al conectarlo se
 * pasan tal cual. `orden`, `disponibles` y los viajeros (`adultos`, `ninos`, `bebes`) son solo
 * del front; de los viajeros se calcula `youngestAge`, que sí va al back.
 */

export const PAGE_SIZE = 8

export const SORT_OPTIONS = [
  { value: '', label: 'Recomendadas' },
  { value: 'precio-asc', label: 'Menor precio' },
  { value: 'precio-desc', label: 'Mayor precio' },
  { value: 'puntuacion', label: 'Mejor puntuadas' },
  { value: 'proximas', label: 'Fechas más próximas' },
]

// Nombre en la URL de los filtros que no son del back
const PARAM_NAMES = { onlyAvailable: 'disponibles', sort: 'orden', adults: 'adultos', children: 'ninos', infants: 'bebes' }

/**
 * Aplica un cambio de filtros sobre los parámetros de la URL (los modifica y los devuelve).
 * Los valores vacíos se borran. Salvo `keepPage`, vuelve a la primera página.
 */
export function applyFilters(params, patch, { keepPage = false } = {}) {
  Object.entries(patch).forEach(([key, value]) => {
    const name = PARAM_NAMES[key] ?? key
    if (value === null || value === undefined || value === '' || value === false) params.delete(name)
    else params.set(name, String(value))
  })
  if (!keepPage) params.delete('page')
  return params
}

const toNumber = (value) => (value === null || value === '' || Number.isNaN(Number(value)) ? null : Number(value))

export function readFilters(params) {
  const travelers = {
    adults: toNumber(params.get('adultos')) ?? 0,
    children: toNumber(params.get('ninos')) ?? 0,
    infants: toNumber(params.get('bebes')) ?? 0,
  }
  return {
    ...travelers,
    // Lugares que necesita el grupo y edad del más chico (para la edad mínima de cada experiencia)
    guests: countSeats(travelers) || null,
    youngestAge: getYoungestAge(travelers),
    title: params.get('title') ?? '',
    categoryId: toNumber(params.get('categoryId')),
    location: params.get('location') ?? '',
    minPrice: toNumber(params.get('minPrice')),
    maxPrice: toNumber(params.get('maxPrice')),
    onlyDiscounted: params.get('onlyDiscounted') === 'true',
    dateFrom: params.get('dateFrom') ?? '',
    dateTo: params.get('dateTo') ?? '',
    onlyAvailable: params.get('disponibles') === 'true',
    sort: params.get('orden') ?? '',
    page: Math.max(toNumber(params.get('page')) ?? 0, 0),
  }
}

/** Fecha local como "2026-10-07" (formato de <input type="date">). */
export function toDateParam(date) {
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const addDays = (date, days) => {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}


/** Atajos de fecha: devuelven { dateFrom, dateTo }. */
export function getDatePresets(today = new Date()) {
  const saturday = addDays(today, (6 - today.getDay() + 7) % 7)
  const weekendStart = today.getDay() === 0 ? today : saturday
  const sunday = today.getDay() === 0 ? today : addDays(saturday, 1)
  return [
    { id: 'hoy', label: 'Hoy', dateFrom: toDateParam(today), dateTo: toDateParam(today) },
    { id: 'manana', label: 'Mañana', dateFrom: toDateParam(addDays(today, 1)), dateTo: toDateParam(addDays(today, 1)) },
    { id: 'finde', label: 'Este finde', dateFrom: toDateParam(weekendStart), dateTo: toDateParam(sunday) },
    { id: 'semana', label: 'Próximos 7 días', dateFrom: toDateParam(today), dateTo: toDateParam(addDays(today, 7)) },
  ]
}

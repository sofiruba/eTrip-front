import { countSeats } from './guests'

/**
 * Filtros del catálogo guardados en la URL (así el link de una búsqueda se puede compartir).
 * Categoría, ciudad/zona y "solo ofertas" los resuelve el back (GET /experiences?...).
 * El resto se aplica en el front (ver utils/experiences.js) porque el back no los tiene igual:
 * texto (busca en título, lugar y anfitrión, sin acentos), precio final con descuento,
 * fechas con lugar para el grupo, "solo con lugares", viajeros, duración, horario y orden.
 */

export const PAGE_SIZE = 8

export const SORT_OPTIONS = [
  { value: '', label: 'Recomendadas' },
  { value: 'precio-asc', label: 'Menor precio' },
  { value: 'precio-desc', label: 'Mayor precio' },
  { value: 'puntuacion', label: 'Mejor puntuadas' },
  { value: 'proximas', label: 'Fechas más próximas' },
]

/** Escalones del filtro de duración, en minutos. El último significa "5 h o más" (sin tope). */
export const DURATION_STEPS = [
  { minutes: 30, label: '30 min' },
  { minutes: 60, label: '1 h' },
  { minutes: 90, label: '1,5 h' },
  { minutes: 120, label: '2 h' },
  { minutes: 180, label: '3 h' },
  { minutes: 240, label: '4 h' },
  { minutes: 300, label: '5 h o más' },
]

/** Franjas horarias según la hora de inicio de cada fecha. */
export const TIME_SLOTS = [
  { id: 'manana', label: 'Mañana', hint: 'Antes de las 12:00', matches: (hour) => hour < 12 },
  { id: 'tarde', label: 'Tarde', hint: 'Entre las 12:00 y las 17:00', matches: (hour) => hour >= 12 && hour < 17 },
  { id: 'noche', label: 'Tarde-noche', hint: 'Después de las 17:00', matches: (hour) => hour >= 17 },
]

// Nombre en la URL de los filtros que no son del back
const PARAM_NAMES = {
  onlyAvailable: 'disponibles',
  sort: 'orden',
  adults: 'adultos',
  children: 'ninos',
  infants: 'bebes',
  durationMin: 'duracionMin',
  durationMax: 'duracionMax',
  times: 'horario',
}

/**
 * Aplica un cambio de filtros sobre los parámetros de la URL (los modifica y los devuelve).
 * Los valores vacíos se borran. Salvo `keepPage`, vuelve a la primera página.
 */
export function applyFilters(params, patch, { keepPage = false } = {}) {
  Object.entries(patch).forEach(([key, rawValue]) => {
    const name = PARAM_NAMES[key] ?? key
    // Las listas (horarios) van en la URL separadas por coma: ?horario=manana,tarde
    const value = Array.isArray(rawValue) ? rawValue.join(',') : rawValue
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
    // Lugares que necesita el grupo
    guests: countSeats(travelers) || null,
    title: params.get('title') ?? '',
    categoryId: toNumber(params.get('categoryId')),
    location: params.get('location') ?? '',
    minPrice: toNumber(params.get('minPrice')),
    maxPrice: toNumber(params.get('maxPrice')),
    onlyDiscounted: params.get('onlyDiscounted') === 'true',
    dateFrom: params.get('dateFrom') ?? '',
    dateTo: params.get('dateTo') ?? '',
    onlyAvailable: params.get('disponibles') === 'true',
    // Duración de la fecha en minutos (null = sin límite) y franjas horarias elegidas
    durationMin: toNumber(params.get('duracionMin')),
    durationMax: toNumber(params.get('duracionMax')),
    times: (params.get('horario') ?? '').split(',').filter((id) => TIME_SLOTS.some((slot) => slot.id === id)),
    sort: params.get('orden') ?? '',
    page: Math.max(toNumber(params.get('page')) ?? 0, 0),
  }
}

/** Query string con los filtros que resuelve el back, o '' si no hay ninguno (entonces se usa el catálogo completo). */
export function toBackQuery(filters) {
  const params = new URLSearchParams()
  if (filters.categoryId) params.set('categoryId', filters.categoryId)
  if (filters.location.trim()) params.set('location', filters.location.trim())
  if (filters.onlyDiscounted) params.set('onlyDiscounted', 'true')
  return params.toString()
}

/** Los mismos filtros sin los que ya aplicó el back (para no repetirlos en el front). */
export const withoutBackFilters = (filters) => ({ ...filters, categoryId: null, location: '', onlyDiscounted: false })

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

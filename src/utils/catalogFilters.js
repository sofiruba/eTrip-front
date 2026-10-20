import { countSeats } from './guests'

/**
 * Filtros del catálogo guardados en la URL (así el link de una búsqueda se puede compartir).
 * TODOS los resuelve el back (GET /experiences?...): el front solo arma la consulta (toBackQuery),
 * ordena el resultado y lo muestra de a una página (ver HomePage).
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

/** Franjas horarias según la hora de inicio de cada fecha (el back filtra con los mismos cortes). */
export const TIME_SLOTS = [
  { id: 'manana', label: 'Mañana', hint: 'Antes de las 12:00' },
  { id: 'tarde', label: 'Tarde', hint: 'Entre las 12:00 y las 17:00' },
  { id: 'noche', label: 'Tarde-noche', hint: 'Después de las 17:00' },
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

/**
 * Query string de GET /experiences con todos los filtros (salvo el orden y la página, que son del front),
 * o '' si no hay ninguno: entonces se usa el catálogo que ya está cargado.
 */
export function toBackQuery(filters) {
  const params = new URLSearchParams()
  const add = (name, value) => {
    if (value !== null && value !== undefined && value !== '' && value !== false) params.set(name, String(value))
  }
  add('title', filters.title.trim())
  add('categoryId', filters.categoryId)
  add('location', filters.location.trim())
  add('minPrice', filters.minPrice)
  add('maxPrice', filters.maxPrice)
  add('onlyDiscounted', filters.onlyDiscounted)
  add('dateFrom', filters.dateFrom)
  add('dateTo', filters.dateTo)
  add('guests', filters.guests)
  add('onlyAvailable', filters.onlyAvailable)
  add('durationMin', filters.durationMin)
  add('durationMax', filters.durationMax)
  add('timeSlots', filters.times.join(','))
  // Con niños o bebés el back no muestra las experiencias solo para mayores de 18
  add('withKids', filters.children > 0 || filters.infants > 0)
  return params.toString()
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

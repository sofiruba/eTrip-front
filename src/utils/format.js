const LOCALE = 'es-AR'

const moneyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1)

export function formatMoney(value) {
  return moneyFormatter.format(value)
}

/** "Sáb 26 oct" */
export function formatShortDate(iso) {
  const text = new Date(iso).toLocaleDateString(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' })
  return capitalize(text.replace(',', '').replaceAll('.', ''))
}

/** "Sábado 26 de octubre" */
export function formatLongDate(iso) {
  return capitalize(new Date(iso).toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', ''))
}

/** "26 de octubre de 2026" */
export function formatFullDate(iso) {
  return new Date(iso).toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' })
}

/** "16:00 hs" */
export function formatTime(iso) {
  return `${new Date(iso).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit', hour12: false })} hs`
}

/** "Sáb 26 oct · 16:00 hs" */
export function formatSessionDate(iso) {
  return `${formatShortDate(iso)} · ${formatTime(iso)}`
}

/** "Hace 3 días", "Hace 2 semanas"... */
export function formatRelativeDate(iso) {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days <= 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} días`
  if (days < 30) return `Hace ${pluralize(Math.round(days / 7), 'semana')}`
  if (days < 365) return `Hace ${pluralize(Math.round(days / 30), 'mes', 'meses')}`
  return `Hace ${pluralize(Math.round(days / 365), 'año')}`
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

export function fullName(user) {
  return user ? `${user.firstName} ${user.lastName}`.trim() : ''
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

export function isPast(iso) {
  return new Date(iso).getTime() < Date.now()
}

/** "sábado, 10 de octubre de 2026" */
export function formatWeekdayDate(iso) {
  return new Date(iso).toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

/** "De 18:30 a 21:30 hs" */
export function formatTimeRange(startIso, endIso) {
  return `De ${formatTime(startIso).replace(' hs', '')} a ${formatTime(endIso)}`
}

/** Minúsculas y sin acentos, para que "ceramica" encuentre "Cerámica". */
export function normalizeText(text = '') {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

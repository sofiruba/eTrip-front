/** Fecha local en formato "2026-10-13T18:00:00" (el que esperan los LocalDateTime del back). */
export function toLocalIso(date) {
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
}

/** Hoy + `days` días, a la hora indicada. */
export function daysFromToday(days, time = '16:00') {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const [hours, minutes] = time.split(':').map(Number)
  date.setHours(hours, minutes, 0, 0)
  return toLocalIso(date)
}

export function addHours(iso, hours) {
  const date = new Date(iso)
  date.setTime(date.getTime() + hours * 3600000)
  return toLocalIso(date)
}

/** Horas entre el inicio y el fin de una sesión. */
export function hoursBetween(startIso, endIso) {
  return Math.round(((new Date(endIso) - new Date(startIso)) / 3600000) * 10) / 10
}

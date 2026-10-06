/**
 * Las fechas mock se calculan relativas a hoy para que la demo
 * siempre tenga planes próximos y pasados, sin importar cuándo se abra.
 */
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

export function toLocalIso(date) {
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
}

/**
 * "Agregar a mi calendario" desde el voucher: un archivo .ics (lo abren Google Calendar, Outlook, el calendario
 * del celular…) y el link directo a Google Calendar. Todo se arma acá, sin pedirle nada a ningún servidor.
 */

// "2026-11-28T18:00:00" (hora local del back) → "20261128T180000" (formato de los calendarios, en hora local)
const toCalendarDate = (iso) => iso.slice(0, 19).replace(/[-:]/g, '')

const escapeText = (text = '') => text.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (char) => `\\${char}`)

/** Evento de un voucher: { title, startsAt, endsAt, location, description, url }. */
function buildIcs(event) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PLAN//Experiencias//ES',
    'BEGIN:VEVENT',
    `UID:${event.uid}@plan`,
    `DTSTAMP:${toCalendarDate(new Date().toISOString())}`,
    `DTSTART:${toCalendarDate(event.startsAt)}`,
    `DTEND:${toCalendarDate(event.endsAt)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `LOCATION:${escapeText(event.location ?? '')}`,
    `DESCRIPTION:${escapeText(event.description ?? '')}`,
    ...(event.url ? [`URL:${event.url}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.join('\r\n')
}

/** Descarga el .ics con el nombre indicado (crea un link temporal y lo "clickea"). */
export function downloadIcs(event, fileName = 'plan.ics') {
  const blob = new Blob([buildIcs(event)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Link para crear el evento en Google Calendar (se abre en otra pestaña). */
export function googleCalendarUrl(event) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${toCalendarDate(event.startsAt)}/${toCalendarDate(event.endsAt)}`,
    details: event.description ?? '',
    location: event.location ?? '',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

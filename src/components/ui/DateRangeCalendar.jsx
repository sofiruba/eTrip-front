import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toDateParam } from '../../utils/catalogFilters'
import './DateRangeCalendar.css'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MAX_MONTHS_AHEAD = 12

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1)
const monthLabel = (date) => capitalize(date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }))
const dayLabel = (date) => date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
const addMonths = (date, months) => new Date(date.getFullYear(), date.getMonth() + months, 1)

/** Días del mes en semanas que empiezan el lunes (null = hueco antes del día 1). */
function getMonthGrid(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const leading = (first.getDay() + 6) % 7
  return [
    ...Array(leading).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1)),
  ]
}

/**
 * Calendario para elegir un día o un rango ("YYYY-MM-DD"). El primer clic marca el
 * inicio; el segundo, el fin (si es anterior al inicio, pasa a ser el nuevo inicio).
 * `markedDates`: Set de días con algo disponible (se marcan con un punto).
 * Muestra dos meses; en pantallas chicas, uno.
 */
function DateRangeCalendar({ dateFrom, dateTo, onChange, markedDates }) {
  // "Hoy" se fija al abrir el calendario
  const [now] = useState(() => new Date())
  const today = toDateParam(now)
  const thisMonth = addMonths(now, 0)
  const [month, setMonth] = useState(() => (dateFrom ? addMonths(new Date(`${dateFrom}T12:00:00`), 0) : addMonths(new Date(), 0)))
  const [hovered, setHovered] = useState(null)

  const canGoBack = month > thisMonth
  const canGoForward = month < addMonths(thisMonth, MAX_MONTHS_AHEAD - 1)
  // Mientras se elige el fin, el rango se previsualiza con el día bajo el mouse
  const choosingEnd = dateFrom && !dateTo
  const rangeEnd = dateTo || (choosingEnd && hovered > dateFrom ? hovered : null)

  const pick = (day) => {
    if (!dateFrom || dateTo || day < dateFrom) onChange({ dateFrom: day, dateTo: '' })
    else onChange({ dateFrom, dateTo: day })
  }

  const renderMonth = (current, extraClass = '') => (
    <div className={`calendar__month ${extraClass}`} key={current.toISOString()}>
      <p className="calendar__title">{monthLabel(current)}</p>
      <div className="calendar__grid" role="grid" aria-label={monthLabel(current)}>
        {WEEKDAYS.map((weekday, index) => (
          <span key={`${weekday}-${index}`} className="calendar__weekday" aria-hidden>
            {weekday}
          </span>
        ))}
        {getMonthGrid(current).map((date, index) => {
          if (!date) return <span key={`empty-${index}`} />
          const day = toDateParam(date)
          const disabled = day < today
          const isStart = day === dateFrom
          const isEnd = day === rangeEnd
          const inRange = dateFrom && rangeEnd && day > dateFrom && day < rangeEnd
          const classes = [
            'calendar__day',
            isStart && 'is-start',
            isEnd && 'is-end',
            (isStart || isEnd) && 'is-selected',
            inRange && 'is-in-range',
            isStart && rangeEnd > dateFrom && 'has-range',
            day === today && 'is-today',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <button
              key={day}
              type="button"
              className={classes}
              disabled={disabled}
              aria-pressed={isStart || isEnd}
              aria-label={`${dayLabel(date)}${markedDates?.has(day) ? ', hay planes' : ''}`}
              onClick={() => pick(day)}
              onMouseEnter={() => setHovered(day)}
              onMouseLeave={() => setHovered(null)}
            >
              <span>{date.getDate()}</span>
              {markedDates?.has(day) && !disabled && <i className="calendar__dot" aria-hidden />}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="calendar">
      <div className="calendar__nav">
        <button type="button" aria-label="Mes anterior" disabled={!canGoBack} onClick={() => setMonth(addMonths(month, -1))}>
          <ChevronLeft size={18} aria-hidden />
        </button>
        <button type="button" aria-label="Mes siguiente" disabled={!canGoForward} onClick={() => setMonth(addMonths(month, 1))}>
          <ChevronRight size={18} aria-hidden />
        </button>
      </div>
      <div className="calendar__months">
        {renderMonth(month)}
        {renderMonth(addMonths(month, 1), 'calendar__month--second')}
      </div>
    </div>
  )
}

export default DateRangeCalendar

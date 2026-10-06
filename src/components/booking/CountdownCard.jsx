import { useCountdown } from '../../hooks/useCountdown'
import './CountdownCard.css'

function CountdownCard({ startsAt }) {
  const { days, hours, minutes, finished } = useCountdown(startsAt)

  if (finished) return <div className="countdown countdown--done">¡Es ahora! Disfrutá tu plan.</div>

  const units = [
    { value: days, label: days === 1 ? 'día' : 'días' },
    { value: String(hours).padStart(2, '0'), label: 'hs' },
    { value: String(minutes).padStart(2, '0'), label: 'min' },
  ]

  return (
    <div className="countdown" aria-label={`Faltan ${days} días, ${hours} horas y ${minutes} minutos`}>
      <span className="countdown__label">Faltan</span>
      <div className="countdown__units">
        {units.map(({ value, label }) => (
          <span key={label}>
            <b>{value}</b>
            <small>{label}</small>
          </span>
        ))}
      </div>
    </div>
  )
}

export default CountdownCard

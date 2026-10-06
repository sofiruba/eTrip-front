import './CapacityBar.css'

/** Barra de ocupación de una sesión: reservados / capacidad. */
function CapacityBar({ session }) {
  const booked = session.capacity - session.availableSeats
  const percent = session.capacity ? Math.round((booked / session.capacity) * 100) : 0

  return (
    <div className="capacity">
      <div className="capacity__bar" role="progressbar" aria-valuenow={booked} aria-valuemin={0} aria-valuemax={session.capacity}>
        <span style={{ width: `${percent}%` }} />
      </div>
      <small>
        <strong>{booked}</strong> de {session.capacity} lugares reservados
      </small>
    </div>
  )
}

export default CapacityBar

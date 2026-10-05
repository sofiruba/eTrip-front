import Money from './Money'

function BookingCard({ item, sessions, chosenSession, onChooseSession, onBook, onAdd }) {
  return <aside className="booking-card-sticky"><div className="booking-price"><strong><Money value={item.price} /></strong><span>por persona</span></div><p className="free-cancel">Cancelación flexible</p><div className="session-picker"><div className="session-picker-heading"><strong>Elegí una sesión</strong><span>{sessions.length} fechas disponibles</span></div>{sessions.map((session, index) => <button className={`session-option ${chosenSession === index ? 'selected' : ''}`} key={session.date} onClick={() => onChooseSession(index)}><span><strong>{session.date}</strong><small>{session.time}</small></span><em>{session.spots} cupos</em></button>)}</div><button className="primary-button full" onClick={onBook}>Reservar esta sesión</button><button className="outline-button full" onClick={onAdd}>Agregar al carrito</button><p className="action-hint">No se te cobrará todavía.</p></aside>
}

export default BookingCard

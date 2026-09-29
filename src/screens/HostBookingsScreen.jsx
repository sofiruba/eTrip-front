import { experiences } from '../data/mockData'
import ImageWithFallback from '../components/ImageWithFallback'

function HostBookingsScreen({ onBack, onNotify }) {
  const reservations = [
    { name: 'Lucía Martínez', people: 2, status: 'Confirmada', message: '¿Podemos encontrarnos cerca de la plaza?' },
    { name: 'Martín Rodríguez', people: 1, status: 'Confirmada', message: '¡Tenemos muchas ganas de ir!' },
    { name: 'Sofía Gómez', people: 2, status: 'Pendiente', message: '¿Hay opciones vegetarianas?' },
  ]
  return <main className="host-dashboard host-bookings-page"><button className="back-button" onClick={onBack}>← Volver al resumen</button><header className="host-page-title"><div><span className="eyebrow">RESERVAS Y MENSAJES</span><h1>Conocé a tus huéspedes.</h1><p>Respondé dudas y prepará cada experiencia con tiempo.</p></div><button className="primary-button" onClick={() => onNotify('Mensaje enviado a todos los huéspedes')}>✉ Escribir a todos</button></header><section className="host-booking-layout"><div className="host-reservation-list"><div className="host-section-heading"><h2>Próxima sesión</h2><span>26 de octubre · 16:00 hs</span></div>{reservations.map((reservation) => <article className="host-reservation-card" key={reservation.name}><span className="avatar">{reservation.name.slice(0, 2).toUpperCase()}</span><div className="host-reservation-main"><div><h3>{reservation.name}</h3><small>{reservation.people} {reservation.people === 1 ? 'persona' : 'personas'} · {reservation.status}</small></div><p>“{reservation.message}”</p><div className="host-reservation-actions"><button onClick={() => onNotify(`Respondiendo a ${reservation.name}`)}>Responder</button><button onClick={() => onNotify('Reserva marcada como revisada')}>Ver reserva</button></div></div></article>)}</div><aside className="host-message-card"><span className="eyebrow">TU EXPERIENCIA</span><ImageWithFallback src={experiences[0].image} alt={experiences[0].title} /><h2>{experiences[0].title}</h2><p>3 reservas · 5 huéspedes · 7 cupos libres</p><button className="outline-button full" onClick={() => onNotify('Calendario abierto')}>Gestionar calendario</button></aside></section></main>
}

export default HostBookingsScreen

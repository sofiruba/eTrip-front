import { experiences } from '../data/mockData'
import ImageWithFallback from '../components/ImageWithFallback'
import CountdownCard from '../components/CountdownCard'

const bookings = [
  { ...experiences[0], target: '2026-10-26T16:00:00', date: 'Lun 26 de octubre de 2026 · 16:00 hs', code: 'ETRIP-8K4M2P' },
  { ...experiences[1], date: 'Mar 27 de octubre de 2026 · 12:30 hs', code: 'ETRIP-4J7N1A' },
  { ...experiences[2], date: 'Jue 12 de noviembre de 2026 · 18:30 hs', code: 'ETRIP-2P9D6L' },
]

function Bookings({ onNavigate }) {
  const [nextBooking, ...otherBookings] = bookings

  return <main className="inner-page">
    <div className="page-title"><span className="intro-tag">MI ACTIVIDAD</span><h1>Mis <em>reservas.</em></h1><p>Todos tus próximos planes en un solo lugar.</p></div>
    <section className="bookings-summary">
      <div><span className="eyebrow">PRÓXIMO PLAN</span><h2>{nextBooking.title}</h2><p>Tu reserva más cercana tiene el contador activo.</p></div>
      <CountdownCard target={nextBooking.target} compact />
    </section>
    <section className="bookings-list">
      <div className="section-heading"><div><span className="eyebrow">RESERVAS CONFIRMADAS</span><h2>{bookings.length} planes reservados</h2></div></div>
      <button className="booking-card booking-button" onClick={() => onNavigate('voucher')}><ImageWithFallback src={nextBooking.image} alt="" /><div><span className="category-label">PRÓXIMA EXPERIENCIA</span><h2>{nextBooking.title}</h2><p>◷ {nextBooking.date}</p><p>⌖ {nextBooking.location}</p></div><div className="voucher-code">{nextBooking.code}<small>Ver voucher →</small></div></button>
      {otherBookings.map((booking) => <button className="booking-card booking-button booking-card-secondary" key={booking.id} onClick={() => onNavigate('voucher')}><ImageWithFallback src={booking.image} alt="" /><div><span className="category-label">RESERVA CONFIRMADA</span><h2>{booking.title}</h2><p>◷ {booking.date}</p><p>⌖ {booking.location}</p></div><div className="voucher-code">{booking.code}<small>Ver voucher →</small></div></button>)}
    </section>
    <button className="write-review-link" onClick={() => onNavigate('review-form')}>★ Ya viviste este plan? Escribí una reseña →</button>
  </main>
}

export default Bookings

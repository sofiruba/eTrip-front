import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatSessionDate, pluralize } from '../../utils/format'
import Button from '../ui/Button'
import ImageWithFallback from '../ui/ImageWithFallback'
import SectionHeader from '../ui/SectionHeader'
import CountdownCard from './CountdownCard'
import './UpcomingPlans.css'

const MAX_SECONDARY = 3

/** Próximos planes del usuario: el más cercano destacado con cuenta regresiva. */
function UpcomingPlans({ bookings }) {
  const [next, ...others] = bookings

  return (
    <section className="section upcoming">
      <SectionHeader eyebrow="Tu actividad" title="Tus próximos planes">
        <Button variant="ghost" iconRight={ArrowRight} to="/mis-reservas">
          Ver {pluralize(bookings.length, 'reserva')}
        </Button>
      </SectionHeader>

      <div className="upcoming__grid">
        <Link to={`/mis-reservas/${next.id}`} className="upcoming__featured">
          <ImageWithFallback src={next.experience?.images[0]} alt="" />
          <div className="upcoming__featured-body">
            <span className="eyebrow">Tu próximo plan</span>
            <h3>{next.experienceTitle}</h3>
            <div className="row">
              <span className="meta">
                <CalendarDays size={15} aria-hidden />
                {formatSessionDate(next.startsAt)}
              </span>
              <span className="meta">
                <MapPin size={15} aria-hidden />
                {next.experience?.location}
              </span>
            </div>
            <CountdownCard startsAt={next.startsAt} />
          </div>
        </Link>

        {others.length > 0 && (
          <ul className="upcoming__list">
            {others.slice(0, MAX_SECONDARY).map((booking) => (
              <li key={booking.id}>
                <Link to={`/mis-reservas/${booking.id}`} className="upcoming__item">
                  <ImageWithFallback src={booking.experience?.images[0]} alt="" />
                  <span>
                    <strong>{booking.experienceTitle}</strong>
                    <small className="muted">{formatSessionDate(booking.startsAt)}</small>
                  </span>
                  <ArrowRight size={18} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export default UpcomingPlans

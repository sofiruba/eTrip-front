import { ArrowRight, CalendarCheck, Star, Store, Wallet } from 'lucide-react'
import { formatLongDate, formatMoney, formatTime, isPast } from '../../utils/format'
import Button from '../ui/Button'
import StatCard from '../ui/StatCard'
import CapacityBar from './CapacityBar'
import './HostOverview.css'

function HostOverview({ experiences, sessions, bookings }) {
  const activeBookings = bookings.filter((booking) => !booking.refunded)
  const income = activeBookings.reduce((sum, booking) => {
    const experience = experiences.find((item) => item.id === booking.experienceId)
    const unitPrice = Number(booking.unitPrice ?? experience?.finalPrice ?? experience?.price ?? 0)
    const quantity = Number(booking.quantity ?? 0)
    return sum + unitPrice * quantity
  }, 0)
  const reviewCount = experiences.reduce((sum, experience) => sum + experience.reviewCount, 0)
  const rating = reviewCount
    ? experiences.reduce((sum, experience) => sum + experience.averageRating * experience.reviewCount, 0) / reviewCount
    : 0
  const nextSession = sessions.find((session) => !isPast(session.startsAt))
  const nextExperience = nextSession && experiences.find((experience) => experience.id === nextSession.experienceId)

  return (
    <div className="stack host-overview">
      <div className="stat-grid">
        <StatCard icon={CalendarCheck} label="Reservas próximas" value={activeBookings.filter((booking) => !booking.isPast).length} />
        <StatCard icon={Wallet} label="Ingresos totales" value={formatMoney(income)} />
        <StatCard icon={Star} label="Calificación" value={reviewCount ? rating.toFixed(1) : '—'} hint={`${reviewCount} reseñas`} />
        <StatCard icon={Store} label="Experiencias" value={experiences.length} />
      </div>

      {nextSession && (
        <section className="card host-next">
          <div>
            <span className="eyebrow">Próxima sesión</span>
            <h2>{formatLongDate(nextSession.startsAt)}</h2>
            <p className="muted">
              {formatTime(nextSession.startsAt)} · {nextExperience?.title}
            </p>
          </div>
          <CapacityBar session={nextSession} />
          <Button variant="secondary" iconRight={ArrowRight} to="/anfitrion/reservas">
            Ver huéspedes
          </Button>
        </section>
      )}
    </div>
  )
}

export default HostOverview

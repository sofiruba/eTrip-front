import { ArrowRight, CalendarCheck, Star, Store, Wallet } from 'lucide-react'
import { formatLongDate, formatMoney, formatTime } from '../../utils/format'
import Button from '../ui/Button'
import StatCard from '../ui/StatCard'
import CapacityBar from './CapacityBar'
import './HostOverview.css'

function HostOverview({ experiences, sessions, bookings }) {
  const activeBookings = bookings.filter((booking) => !booking.refunded)
  // Lo calcula el back por reserva: lo pagado (con el cupón repartido), la comisión de PLAN y lo que te queda
  const sumOf = (field) => activeBookings.reduce((sum, booking) => sum + Number(booking[field] ?? 0), 0)
  const sales = sumOf('paidAmount')
  const commission = sumOf('commission')
  const earnings = sumOf('hostEarnings')
  const reviewCount = experiences.reduce((sum, experience) => sum + experience.reviewCount, 0)
  const rating = reviewCount
    ? experiences.reduce((sum, experience) => sum + experience.averageRating * experience.reviewCount, 0) / reviewCount
    : 0
  // Las fechas vienen ordenadas e incluyen las canceladas y las pasadas: la próxima es la primera activa y futura
  const nextSession = sessions.find((session) => session.editable)
  const nextExperience = nextSession && experiences.find((experience) => experience.id === nextSession.experienceId)

  return (
    <div className="stack host-overview">
      <div className="stat-grid">
        <StatCard icon={CalendarCheck} label="Reservas próximas" value={activeBookings.filter((booking) => !booking.isPast).length} />
        <StatCard
          icon={Wallet}
          label="Tu ganancia"
          value={formatMoney(earnings)}
          hint={`Ventas ${formatMoney(sales)} − comisión PLAN 10 % ${formatMoney(commission)}`}
        />
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
          <Button variant="secondary" iconRight={ArrowRight} to={`/anfitrion/fechas/${nextSession.experienceId}`}>
            Ver huéspedes
          </Button>
        </section>
      )}
    </div>
  )
}

export default HostOverview

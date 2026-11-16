import { useEffect } from 'react'
import { BellRing, CalendarDays, ChevronRight, Store } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { isMissing } from '../../redux/helpers'
import { fetchHostAgenda } from '../../redux/sessionsSlice'
import { formatSessionDate, pluralize } from '../../utils/format'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'
import ErrorState from '../ui/ErrorState'
import ImageWithFallback from '../ui/ImageWithFallback'
import Loading from '../ui/Loading'
import './CapacityBar.css'
import './HostAgenda.css'

/**
 * "Fechas y huéspedes", primer nivel: una fila por experiencia con su resumen. Los números (fechas por estado,
 * lugares reservados, ocupación y lista de espera) los calcula el back (GET /experience-sessions/manage/summary).
 * Se vuelve a pedir solo cuando cambió algo (el slice escucha las acciones que lo afectan).
 * Al tocar una experiencia se abre su detalle: sus fechas y quién reservó en cada una.
 */
function HostAgenda({ experiences }) {
  const dispatch = useDispatch()
  const agenda = useSelector((state) => state.sessions.agenda)

  useEffect(() => {
    if (isMissing(agenda)) dispatch(fetchHostAgenda())
  }, [agenda, dispatch])

  if (!experiences.length) {
    return (
      <EmptyState icon={Store} title="Primero creá una experiencia" text="Después vas a poder sumarle fechas y ver quién reserva.">
        <Button to="/anfitrion/experiencias/nueva">Crear experiencia</Button>
      </EmptyState>
    )
  }
  if (agenda.error) return <ErrorState message={agenda.error} onRetry={() => dispatch(fetchHostAgenda())} />
  if (!agenda.loaded) return <Loading />

  return (
    <ul className="agenda-list">
      {agenda.items.map((item) => {
        // La foto sale de la experiencia que ya está en el store (el resumen no la repite)
        const experience = experiences.find((entry) => entry.id === item.experienceId)
        return (
          <li key={item.experienceId}>
            <Link to={`/anfitrion/fechas/${item.experienceId}`} className="agenda-row">
              <ImageWithFallback className="agenda-row__image" src={experience?.images[0]} alt="" />
              <div className="agenda-row__info">
                <div className="row">
                  <h3>{item.experienceTitle}</h3>
                  {!item.experienceActive && <Badge tone="neutral">Pausada</Badge>}
                </div>
                <p className="agenda-row__next">
                  <CalendarDays size={15} aria-hidden />
                  {item.nextSessionAt ? `Próxima: ${formatSessionDate(item.nextSessionAt)}` : 'Sin fechas próximas'}
                </p>
                <p className="muted small">
                  {pluralize(item.upcomingSessions, 'fecha próxima', 'fechas próximas')} · {pluralize(item.finishedSessions, 'pasada')}
                  {item.cancelledSessions > 0 && ` · ${pluralize(item.cancelledSessions, 'cancelada')}`}
                </p>
              </div>
              <div className="agenda-row__stats">
                {item.capacity > 0 ? (
                  <>
                    <div className="capacity__bar" aria-hidden>
                      <span style={{ width: `${item.occupancyPercent}%` }} />
                    </div>
                    <small>
                      <strong>{pluralize(item.bookedSeats, 'huésped', 'huéspedes')}</strong> · {item.occupancyPercent}% ocupado
                    </small>
                  </>
                ) : (
                  <small className="muted">Sumale fechas para que puedan reservar</small>
                )}
                {item.waitlistCount > 0 && (
                  <Badge tone="warning">
                    <BellRing size={12} aria-hidden />
                    {item.waitlistCount} en lista de espera
                  </Badge>
                )}
              </div>
              <ChevronRight className="agenda-row__chevron" size={20} aria-hidden />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export default HostAgenda

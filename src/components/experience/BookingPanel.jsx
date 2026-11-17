import { useState } from 'react'
import { CalendarX, LayoutDashboard, Pencil, ShoppingBag } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCurrency } from '../../hooks/useCurrency'
import { openAuth } from '../../redux/authSlice'
import { addToCart } from '../../redux/cartSlice'
import { showToast } from '../../redux/toastsSlice'
import { LOW_SEATS } from '../../utils/experiences'
import { formatLongDate, formatTime, pluralize } from '../../utils/format'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'
import Money from '../ui/Money'
import QuantityStepper from '../ui/QuantityStepper'
import WaitlistButton from './WaitlistButton'
import './BookingPanel.css'

/** Panel lateral del detalle: elegir sesión + cantidad y reservar. `ref` (React 19) apunta al panel, para scrollear hasta él. */
function BookingPanel({ id, ref, experience, sessions }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const isAdmin = useSelector((state) => state.auth.user?.role === 'ADMIN')
  const { format } = useCurrency()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const bookable = sessions.filter((session) => session.availableSeats > 0)
  const soldOutSessions = sessions.filter((session) => session.availableSeats === 0)
  const [sessionId, setSessionId] = useState(bookable[0]?.id ?? null)
  const [adding, setAdding] = useState(false) // mientras el back responde, los botones quedan deshabilitados
  // Si viene del buscador con cantidad de personas, arranca con esa cantidad
  const [quantity, setQuantity] = useState(() => Math.max(Number(params.get('personas')) || 1, 1))

  // Si la sesión elegida se agotó, se pasa a la primera disponible
  const selected = bookable.find((session) => session.id === sessionId) ?? bookable[0]
  const isOwner = user?.id === experience.publisherId

  // Lo que ya está en el carrito para esta sesión cuenta contra los cupos
  const inCart = useSelector((state) => state.cart.items.find((item) => item.experienceSessionId === selected?.id)?.quantity ?? 0)
  const maxQuantity = selected ? Math.max(selected.availableSeats - inCart, 0) : 0
  const amount = Math.min(quantity, Math.max(maxQuantity, 1))

  // POST al carrito: el reducer guarda el carrito que devuelve el back (el navbar se actualiza solo, está suscripto).
  // Recién cuando el back responde avisamos (o mostramos el error que mandó)
  const handleAdd = (goToCart) => {
    if (!user) return dispatch(openAuth({ mode: 'login' }))
    if (maxQuantity === 0) return goToCart && navigate('/carrito')
    if (adding) return undefined
    setAdding(true)
    return dispatch(addToCart({ sessionId: selected.id, quantity: amount }))
      .then((action) => {
        if (action.error) {
          return dispatch(showToast({ message: action.error.message, tone: 'error' }))
        }
        if (goToCart) return navigate('/carrito')
        const message = `${pluralize(amount, 'lugar', 'lugares')} agregado${amount === 1 ? '' : 's'} al carrito`
        return dispatch(showToast({ message, link: { label: 'Ver carrito', to: '/carrito' } }))
      })
      .then(() => setAdding(false))
  }

  // Fechas agotadas: "Avisame si se libera un lugar" (lista de espera del back)
  const waitlist = (list) => (
    <ul className="booking-panel__waitlist">
      {list.map((session) => (
        <li key={session.id}>
          <span>
            <strong>{formatLongDate(session.startsAt)}</strong>
            <small>{formatTime(session.startsAt)}</small>
          </span>
          <WaitlistButton session={session} />
        </li>
      ))}
    </ul>
  )

  return (
    <aside id={id} ref={ref} className="booking-panel card">
      <p className="booking-panel__price">
        <strong>
          <Money value={experience.finalPrice} original={experience.price} />
        </strong>
        <span className="muted"> / persona</span>
      </p>

      {isAdmin ? (
        <div className="stack">
          <p className="muted small">
            Estás viendo la publicación como administrador: {pluralize(sessions.length, 'fecha próxima', 'fechas próximas')} y{' '}
            {pluralize(
              sessions.reduce((sum, session) => sum + session.availableSeats, 0),
              'lugar disponible',
              'lugares disponibles',
            )}
            .
          </p>
          <Button icon={LayoutDashboard} full to="/admin/experiencias">
            Gestionar en el panel
          </Button>
        </div>
      ) : isOwner ? (
        <div className="stack">
          <p className="muted small">Esta experiencia es tuya. Podés editarla o sumar fechas desde el modo anfitrión.</p>
          <Button icon={Pencil} full to={`/anfitrion/experiencias/${experience.id}/editar`}>
            Editar experiencia
          </Button>
        </div>
      ) : !sessions.length ? (
        <EmptyState icon={CalendarX} title="Sin fechas disponibles" text="El anfitrión todavía no publicó nuevas sesiones." />
      ) : !bookable.length ? (
        <div className="stack">
          <EmptyState
            icon={CalendarX}
            title="Agotado"
            text="Se agotaron los lugares de todas las fechas. Anotate y te avisamos si alguien libera el suyo."
          />
          {waitlist(soldOutSessions)}
        </div>
      ) : (
        <>
          <fieldset className="booking-panel__sessions">
            <legend>Elegí una fecha</legend>
            {sessions.map((session) => {
              const soldOut = session.availableSeats === 0
              const low = !soldOut && session.availableSeats <= LOW_SEATS
              return (
                <label
                  key={session.id}
                  className={`session-option ${session.id === selected.id ? 'is-selected' : ''} ${soldOut ? 'is-disabled' : ''}`}
                >
                  <input
                    type="radio"
                    name="session"
                    value={session.id}
                    disabled={soldOut}
                    checked={session.id === selected.id}
                    onChange={() => setSessionId(session.id)}
                  />
                  <span>
                    <strong>{formatLongDate(session.startsAt)}</strong>
                    <small>{formatTime(session.startsAt)}</small>
                  </span>
                  <em className={soldOut ? 'is-out' : low ? 'is-low' : ''}>
                    {soldOut
                      ? 'Agotada'
                      : low
                        ? `¡Quedan ${session.availableSeats}!`
                        : pluralize(session.availableSeats, 'lugar', 'lugares')}
                  </em>
                </label>
              )
            })}
          </fieldset>

          <div className="booking-panel__quantity">
            <span>Personas</span>
            <QuantityStepper value={amount} max={Math.max(maxQuantity, 1)} onChange={setQuantity} />
          </div>
          {inCart > 0 && (
            <p className="muted small">
              Ya tenés {pluralize(inCart, 'lugar', 'lugares')} de esta fecha en tu carrito
              {maxQuantity === 0 ? ' y no quedan más disponibles.' : '.'}
            </p>
          )}

          <div className="booking-panel__total">
            <span>Total</span>
            <strong>{format(experience.finalPrice * amount)}</strong>
          </div>

          <Button full onClick={() => handleAdd(true)} disabled={adding}>
            Reservar
          </Button>
          <Button full variant="secondary" icon={ShoppingBag} onClick={() => handleAdd(false)} disabled={maxQuantity === 0 || adding}>
            Agregar al carrito
          </Button>
          <p className="muted small booking-panel__hint">No se te cobra nada todavía.</p>

          {soldOutSessions.length > 0 && (
            <details className="booking-panel__soldout">
              <summary>¿Querías {soldOutSessions.length === 1 ? 'la fecha agotada' : 'una fecha agotada'}? Te avisamos si se libera un lugar</summary>
              {waitlist(soldOutSessions)}
            </details>
          )}
        </>
      )}
    </aside>
  )
}

export default BookingPanel

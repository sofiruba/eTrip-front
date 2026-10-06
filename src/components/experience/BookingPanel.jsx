import { useState } from 'react'
import { CalendarX, Pencil, ShoppingBag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'
import { useToast } from '../../hooks/useToast'
import { formatLongDate, formatMoney, formatTime, pluralize } from '../../utils/format'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'
import Money from '../ui/Money'
import QuantityStepper from '../ui/QuantityStepper'
import './BookingPanel.css'

/** Panel lateral del detalle: elegir sesión + cantidad y reservar. */
function BookingPanel({ experience, sessions }) {
  const { user } = useAuth()
  const cart = useCart()
  const notify = useToast()
  const navigate = useNavigate()
  const bookable = sessions.filter((session) => session.availableSeats > 0)
  const [sessionId, setSessionId] = useState(bookable[0]?.id ?? null)
  const [quantity, setQuantity] = useState(1)

  // Si la sesión elegida se agotó, se pasa a la primera disponible
  const selected = bookable.find((session) => session.id === sessionId) ?? bookable[0]
  const isOwner = user?.id === experience.publisherId

  const addToCart = () => {
    cart.add(selected.id, quantity)
    notify('Sesión agregada a tu carrito')
  }

  return (
    <aside className="booking-panel card">
      <p className="booking-panel__price">
        <strong>
          <Money value={experience.finalPrice} original={experience.price} />
        </strong>
        <span className="muted"> / persona</span>
      </p>

      {isOwner ? (
        <div className="stack">
          <p className="muted small">Esta experiencia es tuya. Podés editarla o sumar fechas desde el modo anfitrión.</p>
          <Button icon={Pencil} full to={`/anfitrion/experiencias/${experience.id}/editar`}>
            Editar experiencia
          </Button>
        </div>
      ) : !bookable.length ? (
        <EmptyState icon={CalendarX} title="Sin fechas disponibles" text="El anfitrión todavía no publicó nuevas sesiones." />
      ) : (
        <>
          <fieldset className="booking-panel__sessions">
            <legend>Elegí una fecha</legend>
            {bookable.map((session) => (
              <label key={session.id} className={`session-option ${session.id === selected.id ? 'is-selected' : ''}`}>
                <input
                  type="radio"
                  name="session"
                  value={session.id}
                  checked={session.id === selected.id}
                  onChange={() => {
                    setSessionId(session.id)
                    setQuantity((current) => Math.min(current, session.availableSeats))
                  }}
                />
                <span>
                  <strong>{formatLongDate(session.startsAt)}</strong>
                  <small>{formatTime(session.startsAt)}</small>
                </span>
                <em className={session.availableSeats <= 3 ? 'is-low' : ''}>{pluralize(session.availableSeats, 'lugar', 'lugares')}</em>
              </label>
            ))}
          </fieldset>

          <div className="booking-panel__quantity">
            <span>Personas</span>
            <QuantityStepper value={quantity} max={selected.availableSeats} onChange={setQuantity} />
          </div>

          <div className="booking-panel__total">
            <span>Total</span>
            <strong>{formatMoney(experience.finalPrice * quantity)}</strong>
          </div>

          <Button
            full
            onClick={() => {
              addToCart()
              navigate('/carrito')
            }}
          >
            Reservar
          </Button>
          <Button full variant="secondary" icon={ShoppingBag} onClick={addToCart}>
            Agregar al carrito
          </Button>
          <p className="muted small booking-panel__hint">No se te cobra nada todavía.</p>
        </>
      )}
    </aside>
  )
}

export default BookingPanel

import { useState } from 'react'
import { CalendarX, Heart, LayoutDashboard, Pencil, ShoppingBag } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { LOW_SEATS } from '../../utils/experiences'
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
function BookingPanel({ id, experience, sessions }) {
  const { user, isAdmin, openAuth } = useAuth()
  const cart = useCart()
  const notify = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const bookable = sessions.filter((session) => session.availableSeats > 0)
  const [sessionId, setSessionId] = useState(bookable[0]?.id ?? null)
  // Si viene del buscador con cantidad de personas, arranca con esa cantidad
  const [quantity, setQuantity] = useState(() => Math.max(Number(params.get('personas')) || 1, 1))

  // Si la sesión elegida se agotó, se pasa a la primera disponible
  const selected = bookable.find((session) => session.id === sessionId) ?? bookable[0]
  const isOwner = user?.id === experience.publisherId

  // Lo que ya está en el carrito para esta sesión cuenta contra los cupos
  const inCart = selected ? cart.quantityOf(selected.id) : 0
  const maxQuantity = selected ? Math.max(selected.availableSeats - inCart, 0) : 0
  const amount = Math.min(quantity, Math.max(maxQuantity, 1))

  // POST al carrito. Recién cuando el back responde avisamos (o mostramos el error que mandó)
  const addToCart = (goToCart) => {
    if (!user) return openAuth('login')
    if (maxQuantity === 0) return goToCart && navigate('/carrito')
    return cart
      .add(selected.id, amount)
      .then(() => {
        if (goToCart) return navigate('/carrito')
        return notify(`${pluralize(amount, 'lugar', 'lugares')} agregado${amount === 1 ? '' : 's'} al carrito`, 'success', {
          label: 'Ver carrito',
          to: '/carrito',
        })
      })
      .catch((error) => notify(error.message, 'error'))
  }

  return (
    <aside id={id} className="booking-panel card">
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
        <EmptyState
          icon={Heart}
          title="Agotado"
          text="Se agotaron los lugares de todas las fechas. Guardala en favoritos para no perderla de vista."
        />
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
            <strong>{formatMoney(experience.finalPrice * amount)}</strong>
          </div>

          <Button full onClick={() => addToCart(true)}>
            Reservar
          </Button>
          <Button full variant="secondary" icon={ShoppingBag} onClick={() => addToCart(false)} disabled={maxQuantity === 0}>
            Agregar al carrito
          </Button>
          <p className="muted small booking-panel__hint">No se te cobra nada todavía.</p>
        </>
      )}
    </aside>
  )
}

export default BookingPanel

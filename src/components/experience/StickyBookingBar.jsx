import Button from '../ui/Button'
import Money from '../ui/Money'
import './StickyBookingBar.css'

/**
 * Barra fija abajo (solo en mobile) con el precio y un botón que lleva al panel de reserva.
 * Se muestra cuando el panel queda fuera de pantalla. Cómo llegar al panel lo resuelve el padre (onShowDates).
 */
function StickyBookingBar({ experience, visible, soldOut, onShowDates }) {
  return (
    <div className={`sticky-booking ${visible ? 'is-visible' : ''}`} aria-hidden={!visible}>
      <p>
        <strong>
          <Money value={experience.finalPrice} original={experience.price} />
        </strong>
        <span className="muted small"> / persona</span>
      </p>
      <Button
        tabIndex={visible ? 0 : -1}
        disabled={soldOut}
        onClick={onShowDates}
      >
        {soldOut ? 'Agotado' : 'Ver fechas'}
      </Button>
    </div>
  )
}

export default StickyBookingBar

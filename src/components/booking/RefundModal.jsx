import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { refundBooking } from '../../redux/bookingsSlice'
import { showToast } from '../../redux/toastsSlice'
import { formatMoney, formatSessionDate } from '../../utils/format'
import { getRefundAmount } from '../../utils/orders'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Notice from '../ui/Notice'

/**
 * Pide el reembolso al back (POST /bookings/{id}/refund). Con la reserva que devuelve, los reducers actualizan
 * la reserva, la orden y los lugares de la fecha (que vuelven a estar disponibles) sin volver a pedir nada.
 * El back vuelve a chequear la política de 48 h: si ya pasó el plazo, se muestra su mensaje.
 */
function RefundModal({ booking, order, onClose }) {
  const dispatch = useDispatch()
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    setSending(true)
    return dispatch(refundBooking(booking.id))
      .then((action) => {
        // rejected: el back respondió con un error (action.error.message, como en el reducer)
        if (action.error) {
          setError(action.error.message)
          setSending(false)
          return
        }
        dispatch(showToast({ message: 'Reembolso confirmado. Te devolvemos el dinero en 5 a 10 días hábiles.' }))
        onClose()
      })
  }

  return (
    <Modal
      title="Solicitar reembolso"
      description={`${booking.experienceTitle} · ${formatSessionDate(booking.startsAt)}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Volver
          </Button>
          <Button type="submit" form="refund-form" disabled={sending}>
            {sending ? 'Cancelando…' : 'Cancelar y pedir reembolso'}
          </Button>
        </>
      }
    >
      <form id="refund-form" className="stack" onSubmit={handleSubmit}>
        <p>
          Vas a recibir {formatMoney(getRefundAmount(booking, order))} y tu voucher {booking.voucherCode} quedará anulado.
          Los lugares vuelven a estar disponibles para otras personas.
        </p>
        {error && <Notice tone="danger">{error}</Notice>}
      </form>
    </Modal>
  )
}

export default RefundModal

import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { refundBooking } from '../../redux/bookingsSlice'
import { showToast } from '../../redux/toastsSlice'
import { formatMoney, formatSessionDate } from '../../utils/format'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Notice from '../ui/Notice'

/**
 * Cancela la reserva con reembolso (POST /bookings/{id}/refund). El back controla el plazo y quién puede hacerlo;
 * si algo no se cumple, se muestra su mensaje. La plata vuelve siempre a quien pagó.
 */
function RefundModal({ booking, onClose }) {
  const dispatch = useDispatch()
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  // Un regalo que me entregaron: lo puedo cancelar, pero la plata vuelve a quien lo pagó
  const giftReceived = booking.giftStatus === 'DELIVERED' && booking.recipientId !== booking.buyerId

  const handleSubmit = (event) => {
    event.preventDefault()
    setSending(true)
    return dispatch(refundBooking(booking.id))
      .then((action) => {
        if (action.error) {
          setError(action.error.message)
          setSending(false)
          return
        }
        dispatch(showToast({ message: giftReceived ? 'Cancelaste el regalo: le devolvimos el dinero a quien lo pagó.' : 'Reembolso confirmado. Te devolvemos el dinero en 5 a 10 días hábiles.' }))
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
          {giftReceived
            ? `${booking.giftFromName} va a recibir el reembolso de ${formatMoney(booking.paidAmount)} y el voucher ${booking.voucherCode} quedará anulado.`
            : `Vas a recibir ${formatMoney(booking.paidAmount)} y tu voucher ${booking.voucherCode} quedará anulado.`}{' '}
          Los lugares vuelven a estar disponibles para otras personas.
        </p>
        {error && <Notice tone="danger">{error}</Notice>}
      </form>
    </Modal>
  )
}

export default RefundModal

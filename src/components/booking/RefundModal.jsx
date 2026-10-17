import { useState } from 'react'
import { useToast } from '../../hooks/useToast'
import { refundBooking } from '../../services/bookingsService'
import { formatMoney, formatSessionDate } from '../../utils/format'
import { getRefundAmount } from '../../utils/orders'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Notice from '../ui/Notice'

/**
 * Pide el reembolso al back (POST /bookings/{id}/refund) y le pasa al padre la reserva actualizada (onRefunded).
 * El back vuelve a chequear la política de 48 h: si ya pasó el plazo, se muestra su mensaje.
 */
function RefundModal({ booking, order, onRefunded, onClose }) {
  const notify = useToast()
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    setSending(true)
    return refundBooking(booking.id)
      .then((updated) => {
        onRefunded(updated)
        notify('Reembolso confirmado. Te devolvemos el dinero en 5 a 10 días hábiles.')
        onClose()
      })
      .catch((refundError) => {
        setError(refundError.message)
        setSending(false)
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

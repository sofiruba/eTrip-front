import { useState } from 'react'
import { useToast } from '../../hooks/useToast'
import { refundBooking } from '../../services/bookingsService'
import { formatMoney, formatSessionDate } from '../../utils/format'
import { getRefundAmount } from '../../utils/orders'
import Button from '../ui/Button'
import FormField from '../ui/FormField'
import Modal from '../ui/Modal'

const REASONS = ['Tuve un imprevisto', 'No puedo asistir en esa fecha', 'Me equivoqué al reservar', 'Otro motivo']

/** Pide el reembolso al back y le pasa al padre la reserva actualizada (onRefunded). */
function RefundModal({ booking, order, onRefunded, onClose }) {
  const notify = useToast()
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!reason) return setError('Elegí un motivo.')
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
            Cancelar
          </Button>
          <Button type="submit" form="refund-form" disabled={sending}>
            Confirmar reembolso
          </Button>
        </>
      }
    >
      <form id="refund-form" className="stack" onSubmit={handleSubmit}>
        <FormField
          as="select"
          label="Motivo"
          value={reason}
          error={error}
          onChange={(event) => {
            setReason(event.target.value)
            setError('')
          }}
        >
          <option value="">Elegí una opción</option>
          {REASONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </FormField>
        <FormField as="textarea" label="Detalle (opcional)" rows={3} placeholder="Contanos un poco más..." />
        <p className="muted small">
          Vas a recibir {formatMoney(getRefundAmount(booking, order))} y tu voucher {booking.voucherCode} quedará anulado.
        </p>
      </form>
    </Modal>
  )
}

export default RefundModal

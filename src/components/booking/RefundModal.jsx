import { useState } from 'react'
import { useStore } from '../../hooks/useStore'
import { useToast } from '../../hooks/useToast'
import { formatMoney, formatSessionDate } from '../../utils/format'
import Button from '../ui/Button'
import FormField from '../ui/FormField'
import Modal from '../ui/Modal'

const REASONS = ['Tuve un imprevisto', 'No puedo asistir en esa fecha', 'Me equivoqué al reservar', 'Otro motivo']

function RefundModal({ booking, onClose }) {
  const { refundBooking } = useStore()
  const notify = useToast()
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!reason) return setError('Elegí un motivo.')
    refundBooking(booking.id)
    notify('Reembolso confirmado. Te devolvemos el dinero en 5 a 10 días hábiles.')
    return onClose()
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
          <Button type="submit" form="refund-form">
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
          Vas a recibir {formatMoney(booking.unitPrice * booking.quantity)} y tu voucher {booking.voucherCode} quedará anulado.
        </p>
      </form>
    </Modal>
  )
}

export default RefundModal

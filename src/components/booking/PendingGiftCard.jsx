import { useState } from 'react'
import { Gift, Pencil } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { cancelGift, updateGiftEmail } from '../../redux/ordersSlice'
import { showToast } from '../../redux/toastsSlice'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import FormField from '../ui/FormField'

/**
 * Regalo pendiente (lo ve quien pagó): el back todavía no se lo pasó a quien lo recibe porque no hay una cuenta
 * verificada con ese email. Hasta entonces el voucher es de quien pagó, que puede corregir el email
 * (por si lo escribió mal) o quedarse el plan. Las reglas las controla el back (PATCH / DELETE /orders/{id}/gift).
 */
function PendingGiftCard({ order }) {
  const dispatch = useDispatch()
  const [editing, setEditing] = useState(false)
  const [email, setEmail] = useState(order.giftRecipientEmail ?? '')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [keeping, setKeeping] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    setSending(true)
    setError('')
    return dispatch(updateGiftEmail({ orderId: order.id, recipientEmail: email.trim() })).then((action) => {
      setSending(false)
      // rejected: el back respondió con un error (action.error.message, como en el reducer)
      if (action.error) return setError(action.error.message)
      setEditing(false)
      const delivered = action.payload.giftStatus === 'DELIVERED'
      return dispatch(
        showToast({
          message: delivered
            ? `Listo: ${order.giftRecipientName} ya tiene el regalo en sus reservas`
            : `Le mandamos la invitación a ${action.payload.giftRecipientEmail}`,
        }),
      )
    })
  }

  return (
    <section className="card stack pending-gift">
      <span className="eyebrow">
        <Gift size={14} aria-hidden /> Regalo pendiente
      </span>
      <p>
        Le mandamos una invitación a <strong>{order.giftRecipientEmail}</strong>. El regalo pasa a ser de{' '}
        <strong>{order.giftRecipientName}</strong> cuando entre a PLAN con ese email y lo verifique.
      </p>
      <p className="muted small">Hasta entonces el voucher es tuyo: si el email estaba mal, corregilo o quedate el plan.</p>

      {editing ? (
        <form className="stack" onSubmit={handleSubmit}>
          <FormField
            label="Email de quien lo recibe"
            type="email"
            value={email}
            error={error}
            onChange={(event) => {
              setEmail(event.target.value)
              setError('')
            }}
            autoFocus
          />
          <div className="row">
            <Button type="submit" disabled={sending}>
              {sending ? 'Enviando…' : 'Guardar y reenviar'}
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)} disabled={sending}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <div className="row">
          <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>
            Corregir email
          </Button>
          <Button variant="ghost" onClick={() => setKeeping(true)}>
            Me lo quedo
          </Button>
        </div>
      )}

      {keeping && (
        <ConfirmDialog
          title="¿Te quedás con este plan?"
          message={`Deja de ser un regalo para ${order.giftRecipientName}: las reservas pasan a ser tuyas, como cualquier compra.`}
          confirmLabel="Me lo quedo"
          onConfirm={() =>
            dispatch(cancelGift(order.id)).then((action) => {
              if (action.error) return dispatch(showToast({ message: action.error.message, tone: 'error' }))
              return dispatch(showToast({ message: 'Listo, el plan es tuyo' }))
            })
          }
          onClose={() => setKeeping(false)}
        />
      )}
    </section>
  )
}

export default PendingGiftCard

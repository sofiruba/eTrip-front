import { Gift } from 'lucide-react'
import FormField from '../ui/FormField'
import './GiftFields.css'

export const MAX_GIFT_MESSAGE = 300

/**
 * "Es un regalo": nombre de quien lo recibe, su email (opcional) y un mensaje. Va en la orden (POST /orders, campo `gift`).
 * Si el email es de una cuenta de PLAN, esa persona ve la reserva en sus "Mis reservas" y recibe el aviso.
 */
function GiftFields({ gift, onChange, errors = {} }) {
  const setField = (field) => (event) => onChange({ ...gift, [field]: event.target.value })

  return (
    <section className="checkout__panel gift-fields">
      <label className="checkbox gift-fields__toggle">
        <input type="checkbox" checked={gift.enabled} onChange={(event) => onChange({ ...gift, enabled: event.target.checked })} />
        <Gift size={18} aria-hidden />
        <span>
          <strong>Es un regalo</strong>
          <small className="muted">El voucher sale a nombre de quien lo recibe, con tu mensaje.</small>
        </span>
      </label>

      {gift.enabled && (
        <div className="stack">
          <div className="form-grid">
            <FormField label="Para" value={gift.recipientName} onChange={setField('recipientName')} error={errors.recipientName} placeholder="Nombre de quien lo recibe" maxLength={100} />
            <FormField
              label="Su email (opcional)"
              type="email"
              value={gift.recipientEmail}
              onChange={setField('recipientEmail')}
              error={errors.recipientEmail}
              hint="Si tiene cuenta en PLAN, la reserva le aparece en Mis reservas."
            />
          </div>
          <FormField
            as="textarea"
            label="Mensaje (opcional)"
            rows={3}
            value={gift.message}
            onChange={setField('message')}
            maxLength={MAX_GIFT_MESSAGE}
            placeholder="¡Feliz cumple! Para que lo disfrutes como te gusta."
            hint={`${gift.message.length}/${MAX_GIFT_MESSAGE}`}
          />
        </div>
      )}
    </section>
  )
}

export default GiftFields

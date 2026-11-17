import { Gift } from 'lucide-react'
import FormField from '../ui/FormField'
import './GiftFields.css'

const MAX_GIFT_MESSAGE = 300

/**
 * "Es un regalo": nombre de quien lo recibe, su email (opcional) y un mensaje. Va en la orden (POST /orders, campo `gift`).
 * Con email, el back le manda un mail (sin el voucher). El regalo pasa a ser suyo recién cuando tiene una cuenta
 * VERIFICADA con ese email: si ya la tiene, en el momento; si no, cuando la crea. Hasta entonces el voucher es de quien
 * pagó, que puede corregir el email o quedárselo desde la reserva.
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
          <small className="muted">Le avisamos por mail con tu mensaje y el plan pasa a su cuenta de PLAN.</small>
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
              hint="Le avisamos por mail. El regalo pasa a ser suyo cuando entra a PLAN con ese email y lo verifica; hasta entonces el voucher es tuyo y podés corregir el email."
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

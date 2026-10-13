import { ShieldCheck, ShieldX } from 'lucide-react'
import './CancellationPolicy.css'

/** Aviso de si la reserva todavía se puede reembolsar. `policy` viene de getCancellationPolicy(). */
function CancellationPolicy({ policy }) {
  return (
    <section className={`card booking-policy ${policy.refundable ? '' : 'is-locked'}`}>
      {policy.refundable ? <ShieldCheck size={20} aria-hidden /> : <ShieldX size={20} aria-hidden />}
      <div>
        <strong>{policy.title}</strong>
        <p className="muted small">{policy.text}</p>
      </div>
    </section>
  )
}

export default CancellationPolicy

import { Check } from 'lucide-react'
import './CheckoutSteps.css'

const STEPS = ['Carrito', 'Pago', 'Confirmación']

/** Indicador de pasos de la compra. current: 0 = carrito, 1 = pago, 2 = confirmación. */
function CheckoutSteps({ current }) {
  return (
    <ol className="checkout-steps" aria-label="Pasos de la compra">
      {STEPS.map((step, index) => {
        const state = index < current ? 'is-done' : index === current ? 'is-current' : ''
        return (
          <li key={step} className={state} aria-current={index === current ? 'step' : undefined}>
            <span className="checkout-steps__dot">{index < current ? <Check size={14} aria-hidden /> : index + 1}</span>
            {step}
          </li>
        )
      })}
    </ol>
  )
}

export default CheckoutSteps

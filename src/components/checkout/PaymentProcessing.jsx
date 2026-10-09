import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, CircleX, LoaderCircle } from 'lucide-react'
import { useModalBehavior } from '../../hooks/useModalBehavior'
import { formatMoney } from '../../utils/format'
import Button from '../ui/Button'
import './PaymentProcessing.css'

const STEP_MS = 1300
const APPROVED_MS = 900

/**
 * Pantalla de "conectando con el banco" que simula la pasarela.
 * El resultado (approved) se decide antes; acá solo se muestra el recorrido.
 */
function PaymentProcessing({ provider, amount, approved, onApproved, onDeclined }) {
  const steps = [`Conectando con ${provider}…`, 'Procesando el pago…', approved ? 'Confirmando tu reserva…' : 'Esperando respuesta del banco…']
  const [step, setStep] = useState(0)
  const [status, setStatus] = useState('processing') // processing | approved | declined
  const [failureMessage, setFailureMessage] = useState('')
  const onApprovedRef = useRef(onApproved)
  useModalBehavior(() => {}) // bloquea scroll; Escape no cancela un pago en curso

  useEffect(() => {
    onApprovedRef.current = onApproved
  })

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), STEP_MS),
      setTimeout(() => setStep(2), STEP_MS * 2),
      setTimeout(() => setStatus(approved ? 'approved' : 'declined'), STEP_MS * 3),
    ]
    if (approved) {
      timers.push(
        setTimeout(async () => {
          const result = await onApprovedRef.current()
          if (result?.ok === false) {
            setFailureMessage(result.message || 'No pudimos confirmar la reserva. No se realizó el cobro.')
            setStatus('declined')
          }
        }, STEP_MS * 3 + APPROVED_MS),
      )
    }
    return () => timers.forEach(clearTimeout)
  }, [approved])

  return createPortal(
    <div className="payment-processing" role="alertdialog" aria-modal="true" aria-labelledby="payment-processing-title">
      <div className={`payment-processing__panel is-${status}`}>
        <div className="payment-processing__icon" aria-hidden>
          {status === 'processing' && <LoaderCircle size={56} className="payment-processing__spinner" />}
          {status === 'approved' && <Check size={44} />}
          {status === 'declined' && <CircleX size={52} />}
        </div>

        <h2 id="payment-processing-title" aria-live="polite">
          {status === 'processing' && steps[step]}
          {status === 'approved' && '¡Pago aprobado!'}
          {status === 'declined' && 'El banco rechazó el pago'}
        </h2>

        {status === 'processing' && (
          <>
            <p className="muted">No cierres ni actualices esta página.</p>
            <ol className="payment-processing__steps">
              {steps.map((label, index) => (
                <li key={label} className={index < step ? 'is-done' : index === step ? 'is-current' : ''}>
                  <span aria-hidden>{index < step ? <Check size={14} /> : index + 1}</span>
                  {label.replace('…', '')}
                </li>
              ))}
            </ol>
          </>
        )}
        {status === 'approved' && <p className="muted">Pagaste {formatMoney(amount)}. Estamos generando tus vouchers.</p>}
        {status === 'declined' && (
          <>
            <p className="muted">
              {failureMessage || 'La tarjeta no tiene fondos suficientes o el banco no autorizó la operación. No se te cobró nada.'}
            </p>
            <Button onClick={onDeclined}>Probar con otro medio de pago</Button>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}

export default PaymentProcessing

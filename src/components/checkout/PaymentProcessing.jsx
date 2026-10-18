import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, CircleX, LoaderCircle } from 'lucide-react'
import { useModalBehavior } from '../../hooks/useModalBehavior'
import { formatMoney } from '../../utils/format'
import Button from '../ui/Button'
import './PaymentProcessing.css'

const STEP_MS = 900
const APPROVED_MS = 900

/**
 * Pantalla de "procesando el pago". Toda la decisión la toma el back: al montarse se llama a `onConfirm`
 * (POST /orders, devuelve { ok, order } o { ok: false, message }). Mientras tanto se muestran los pasos
 * como animación. Si el back aprueba → "¡Listo!" y `onDone(order)`; si rechaza (tarjeta rechazada, sin cupos,
 * cupón usado…) se muestra su mensaje y el botón llama a `onFailed(message)`.
 */
function PaymentProcessing({ provider, amount, onConfirm, onDone, onFailed }) {
  const steps = [`Conectando con ${provider}…`, 'Procesando el pago…', 'Confirmando tu reserva…']
  const [step, setStep] = useState(0)
  const [status, setStatus] = useState('processing') // processing | approved | failed
  const [failureMessage, setFailureMessage] = useState('')
  const [paidAmount, setPaidAmount] = useState(amount)
  const callbacks = useRef({ onConfirm, onDone })
  useModalBehavior(() => {}) // bloquea scroll; Escape no cancela un pago en curso

  useEffect(() => {
    callbacks.current = { onConfirm, onDone }
  })

  useEffect(() => {
    let active = true
    const timers = [setTimeout(() => setStep(1), STEP_MS), setTimeout(() => setStep(2), STEP_MS * 2)]
    // La animación dura al menos los tres pasos aunque el back responda antes
    const minimum = new Promise((resolve) => timers.push(setTimeout(resolve, STEP_MS * 3)))

    // El pedido sale desde un timer (y no directo en el efecto): en desarrollo StrictMode monta el efecto
    // dos veces, y la limpieza cancela el timer del primer montaje. Así POST /orders se hace una sola vez.
    timers.push(
      setTimeout(() => {
        Promise.all([callbacks.current.onConfirm(), minimum]).then(([result]) => {
          if (!active) return
          if (!result.ok) {
            setFailureMessage(result.message)
            setStatus('failed')
            return
          }
          setPaidAmount(Number(result.order.total))
          setStatus('approved')
          timers.push(setTimeout(() => callbacks.current.onDone(result.order), APPROVED_MS))
        })
      }, STEP_MS),
    )

    // Desmontaje: se cancelan los timers pendientes y se ignora una respuesta que llegue tarde
    return () => {
      active = false
      timers.forEach(clearTimeout)
    }
  }, [])

  return createPortal(
    <div className="payment-processing" role="alertdialog" aria-modal="true" aria-labelledby="payment-processing-title">
      <div className={`payment-processing__panel is-${status === 'failed' ? 'declined' : status}`}>
        <div className="payment-processing__icon" aria-hidden>
          {status === 'processing' && <LoaderCircle size={56} className="payment-processing__spinner" />}
          {status === 'approved' && <Check size={44} />}
          {status === 'failed' && <CircleX size={52} />}
        </div>

        <h2 id="payment-processing-title" aria-live="polite">
          {status === 'processing' && steps[step]}
          {status === 'approved' && '¡Listo, reserva confirmada!'}
          {status === 'failed' && 'No pudimos confirmar tu compra'}
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
        {status === 'approved' && <p className="muted">Pagaste {formatMoney(paidAmount)}. Estamos generando tus vouchers.</p>}
        {status === 'failed' && (
          <>
            <p className="muted">{failureMessage} No se te cobró nada.</p>
            <Button onClick={() => onFailed(failureMessage)}>Volver a revisar mi compra</Button>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}

export default PaymentProcessing

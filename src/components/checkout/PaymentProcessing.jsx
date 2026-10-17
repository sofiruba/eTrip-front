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
 * Pantalla de "conectando con el banco" que simula la pasarela (la consigna pide checkout sin procesamiento de pago).
 * Si el pago simulado se aprueba, en el paso "Confirmando tu reserva…" se crea la orden en el back con `onConfirm`
 * (devuelve una promesa con { ok, order } o { ok: false, message }). Recién si el back la confirma se muestra
 * "¡Listo!" y se llama a `onDone(order)`; si el back la rechaza (sin cupos, fecha pasada, cupón ya usado…)
 * se muestra su mensaje y el botón llama a `onFailed(message)`. La tarjeta de prueba rechazada llama a `onDeclined`.
 */
function PaymentProcessing({ provider, amount, approved, onConfirm, onDone, onFailed, onDeclined }) {
  const steps = [`Conectando con ${provider}…`, 'Procesando el pago…', approved ? 'Confirmando tu reserva…' : 'Esperando respuesta del banco…']
  const [step, setStep] = useState(0)
  const [status, setStatus] = useState('processing') // processing | approved | declined | failed
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

    if (!approved) {
      timers.push(setTimeout(() => setStatus('declined'), STEP_MS * 3))
    } else {
      // POST /orders: el total y los cupos los valida el back
      timers.push(
        setTimeout(() => {
          callbacks.current.onConfirm().then((result) => {
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
        }, STEP_MS * 3),
      )
    }

    // Desmontaje: se cancelan los timers pendientes y se ignora una respuesta que llegue tarde
    return () => {
      active = false
      timers.forEach(clearTimeout)
    }
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
          {status === 'approved' && '¡Listo, reserva confirmada!'}
          {status === 'declined' && 'El banco rechazó el pago'}
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
        {status === 'declined' && (
          <>
            <p className="muted">La tarjeta no tiene fondos suficientes o el banco no autorizó la operación. No se te cobró nada.</p>
            <Button onClick={onDeclined}>Probar con otro medio de pago</Button>
          </>
        )}
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

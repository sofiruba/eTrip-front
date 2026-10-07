import { useState } from 'react'
import { useStore } from '../../hooks/useStore'
import { useToast } from '../../hooks/useToast'
import { formatMoney } from '../../utils/format'
import { getFinalPrice } from '../../utils/orders'
import Button from '../ui/Button'
import Chip from '../ui/Chip'
import FormField from '../ui/FormField'
import Modal from '../ui/Modal'

const MAX_DISCOUNT = 90
const PRESETS = [0, 10, 15, 20, 30]

/** Cambia solo el descuento de una experiencia (PATCH /experiences/{id}/discount en el back). */
function DiscountModal({ experience, onClose }) {
  const { update } = useStore()
  const notify = useToast()
  const [value, setValue] = useState(String(experience.discountPercentage ?? 0))
  const [error, setError] = useState('')

  const percentage = Number(value)
  const valid = value !== '' && Number.isInteger(percentage) && percentage >= 0 && percentage <= MAX_DISCOUNT

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!valid) return setError(`Ingresá un número entero entre 0 y ${MAX_DISCOUNT}.`)
    update('experiences', experience.id, { discountPercentage: percentage })
    notify(percentage ? `Descuento del ${percentage}% aplicado` : 'Descuento quitado')
    return onClose()
  }

  return (
    <Modal
      title="Descuento"
      description={experience.title}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="discount-form">
            Guardar
          </Button>
        </>
      }
    >
      <form id="discount-form" className="stack" onSubmit={handleSubmit} noValidate>
        <div className="chip-list" role="group" aria-label="Descuentos sugeridos">
          {PRESETS.map((preset) => (
            <Chip
              key={preset}
              selected={percentage === preset && value !== ''}
              onClick={() => {
                setValue(String(preset))
                setError('')
              }}
            >
              {preset ? `${preset}%` : 'Sin descuento'}
            </Chip>
          ))}
        </div>
        <FormField
          label="Porcentaje (%)"
          type="number"
          min="0"
          max={MAX_DISCOUNT}
          value={value}
          error={error}
          onChange={(event) => {
            setValue(event.target.value)
            setError('')
          }}
        />
        {valid && (
          <p className="muted small">
            Precio por persona: {percentage > 0 && <s>{formatMoney(experience.price)}</s>}{' '}
            <strong>{formatMoney(getFinalPrice({ price: experience.price, discountPercentage: percentage }))}</strong>
          </p>
        )}
      </form>
    </Modal>
  )
}

export default DiscountModal

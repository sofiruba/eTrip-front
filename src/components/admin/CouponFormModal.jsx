import { useState } from 'react'
import { useStore } from '../../hooks/useStore'
import { useToast } from '../../hooks/useToast'
import { daysFromToday } from '../../data/dates'
import Button from '../ui/Button'
import FormField from '../ui/FormField'
import Modal from '../ui/Modal'

function CouponFormModal({ coupon, onClose }) {
  const { db, create, update } = useStore()
  const notify = useToast()
  const [form, setForm] = useState({
    code: coupon?.code ?? '',
    percentage: coupon?.percentage ?? 10,
    validFrom: (coupon?.validFrom ?? daysFromToday(0)).slice(0, 10),
    validUntil: (coupon?.validUntil ?? daysFromToday(30)).slice(0, 10),
    active: coupon?.active ?? true,
  })
  const [errors, setErrors] = useState({})
  const setField = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  const handleSubmit = (event) => {
    event.preventDefault()
    const code = form.code.trim().toUpperCase()
    const percentage = Number(form.percentage)
    const nextErrors = {}
    if (!/^[A-Z0-9]{4,20}$/.test(code)) nextErrors.code = 'Entre 4 y 20 letras o números, sin espacios.'
    else if (db.coupons.some((entry) => entry.code === code && entry.id !== coupon?.id)) nextErrors.code = 'Ese código ya existe.'
    if (!(percentage >= 1 && percentage <= 100)) nextErrors.percentage = 'Entre 1 y 100.'
    if (form.validUntil < form.validFrom) nextErrors.validUntil = 'Tiene que ser posterior al inicio.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const data = {
      code,
      percentage,
      validFrom: `${form.validFrom}T00:00:00`,
      validUntil: `${form.validUntil}T23:59:00`,
      active: form.active,
    }
    if (coupon) update('coupons', coupon.id, data)
    else create('coupons', data)
    notify(coupon ? 'Cupón actualizado' : 'Cupón creado')
    onClose()
  }

  return (
    <Modal
      title={coupon ? 'Editar cupón' : 'Nuevo cupón'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="coupon-form">
            Guardar
          </Button>
        </>
      }
    >
      <form id="coupon-form" className="stack" onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <FormField
            label="Código"
            value={form.code}
            error={errors.code}
            placeholder="PLANFINDE10"
            onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
          />
          <FormField label="Descuento (%)" type="number" min="1" max="100" value={form.percentage} error={errors.percentage} onChange={setField('percentage')} />
          <FormField label="Válido desde" type="date" value={form.validFrom} onChange={setField('validFrom')} />
          <FormField label="Válido hasta" type="date" value={form.validUntil} error={errors.validUntil} onChange={setField('validUntil')} />
        </div>
        <label className="checkbox">
          <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
          Cupón activo
        </label>
      </form>
    </Modal>
  )
}

export default CouponFormModal

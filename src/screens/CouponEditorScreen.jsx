import { useState } from 'react'
import FormField, { FormActions } from '../components/FormField'
import ScreenIntro from '../components/ScreenIntro'

function CouponEditor({ coupon, onBack, onSave }) {
  const [code, setCode] = useState(coupon?.code || '')
  const [discount, setDiscount] = useState(coupon?.discount?.replace('%', '') || '')
  const [active, setActive] = useState(coupon?.state !== 'Inactivo')
  return <main className="inner-page narrow"><button className="back-button" onClick={onBack}>← Volver a cupones</button><ScreenIntro eyebrow="ADMINISTRACIÓN" title={coupon ? 'Editar' : 'Crear'} accent="cupón." description="Definí una promoción simple para los próximos planes." /><form className="form-card" onSubmit={(event) => { event.preventDefault(); onSave({ code: code.toUpperCase(), discount: `${discount}%`, state: active ? 'Activo' : 'Inactivo' }); onBack() }}><FormField label="Código" value={code} onChange={(event) => setCode(event.target.value)} required placeholder="PLANFINDE10" /><FormField label="Descuento (%)" value={discount} onChange={(event) => setDiscount(event.target.value)} type="number" min="1" max="100" required /><label className="checkbox-label"><input checked={active} onChange={(event) => setActive(event.target.checked)} type="checkbox" /> Cupón activo</label><FormActions onCancel={onBack} submitLabel="Guardar cupón →" /></form></main>
}

export default CouponEditor

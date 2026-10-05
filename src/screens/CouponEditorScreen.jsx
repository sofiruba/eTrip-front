import { useState } from 'react'

function CouponEditor({ coupon, onBack, onSave }) {
  const [code, setCode] = useState(coupon?.code || '')
  const [discount, setDiscount] = useState(coupon?.discount?.replace('%', '') || '')
  const [active, setActive] = useState(coupon?.state !== 'Inactivo')
  return <main className="inner-page narrow"><button className="back-button" onClick={onBack}>← Volver a cupones</button><div className="page-title"><span className="intro-tag">ADMINISTRACIÓN</span><h1>{coupon ? 'Editar' : 'Crear'} <em>cupón.</em></h1><p>Definí una promoción simple para los próximos planes.</p></div><form className="form-card" onSubmit={(event) => { event.preventDefault(); onSave({ code: code.toUpperCase(), discount: `${discount}%`, state: active ? 'Activo' : 'Inactivo' }); onBack() }}><label>Código<input value={code} onChange={(event) => setCode(event.target.value)} required placeholder="PLANFINDE10" /></label><label>Descuento (%)<input value={discount} onChange={(event) => setDiscount(event.target.value)} type="number" min="1" max="100" required /></label><label className="checkbox-label"><input checked={active} onChange={(event) => setActive(event.target.checked)} type="checkbox" /> Cupón activo</label><div className="form-actions"><button type="button" className="outline-button" onClick={onBack}>Cancelar</button><button className="primary-button">Guardar cupón →</button></div></form></main>
}

export default CouponEditor

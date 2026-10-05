import { useState } from 'react'
import ManagementHeader from '../components/ManagementHeader'

function CouponManagementScreen({ onBack, onCreate, onEdit }) {
  const [coupons, setCoupons] = useState([{ code: 'PLANFINDE10', discount: '10%', state: 'Activo' }, { code: 'BIENVENIDA20', discount: '20%', state: 'Inactivo' }])
  return <main className="inner-page"><button className="back-button" onClick={onBack}>← Volver al panel</button><ManagementHeader eyebrow="ADMINISTRACIÓN" title="Cupones." description="Creá promociones y controlá su vigencia." action="Nuevo cupón" onAction={onCreate} /><div className="management-list">{coupons.map((coupon) => <article className="management-row simple-row" key={coupon.code}><span className="coupon-icon">%</span><div><strong>{coupon.code}</strong><small>Descuento del {coupon.discount}</small></div><span className={`status ${coupon.state === 'Activo' ? 'active' : 'inactive'}`}>{coupon.state}</span><button className="row-action" onClick={() => onEdit(coupon)}>Editar</button><button className="row-delete" onClick={() => setCoupons(coupons.filter((item) => item.code !== coupon.code))}>Eliminar</button></article>)}</div></main>
}

export default CouponManagementScreen

import { useState } from 'react'

const seed = { orders: [['#ETRIP-1042', 'Sofía Rubachin', '$28.000', 'Confirmada'], ['#ETRIP-1038', 'Agustina V.', '$25.000', 'Confirmada']], bookings: [['Paseo por La Boca', '26 Oct · 16:00', '3 huéspedes'], ['Pasta italiana casera', '27 Oct · 12:30', '5 huéspedes']], reviews: [['Lucía M.', 'Paseo por La Boca', '★★★★★'], ['Martín R.', 'Pasta italiana casera', '★★★★★']] }

function AdminOperations({ type, onBack, onNotify, onDetail }) {
  const [items, setItems] = useState(seed[type])
  const labels = { orders: ['Órdenes globales', 'Consultá todas las compras de PLAN.'], bookings: ['Reservas globales', 'Supervisá las reservas y sus estados.'], reviews: ['Reseñas globales', 'Moderá los comentarios de la comunidad.'] }
  const remove = (index) => { setItems((current) => current.filter((_, itemIndex) => itemIndex !== index)); onNotify('Elemento eliminado') }
  return <main className="inner-page"><button className="back-button" onClick={onBack}>← Volver al panel</button><div className="page-title"><span className="intro-tag">ADMINISTRACIÓN</span><h1>{labels[type][0]}.</h1><p>{labels[type][1]}</p></div><div className="management-list">{items.map((item, index) => <article className="management-row admin-operation-row" key={`${item[0]}-${index}`}><div><strong>{item[0]}</strong><small>{item[1]}</small></div><span className={type === 'reviews' ? 'stars' : 'status active'}>{item[2]}</span><span className="muted">{item[3] || 'Activa'}</span><button className="row-action" onClick={() => onDetail(item)}>Ver detalle</button>{type === 'reviews' && <button className="row-delete" onClick={() => remove(index)}>Eliminar</button>}</article>)}</div></main>
}

export default AdminOperations

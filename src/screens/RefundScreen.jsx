import { useState } from 'react'

function Refund({ onBack, onNotify }) {
  const [reason, setReason] = useState('')
  const submit = (event) => { event.preventDefault(); onNotify('Solicitud de reembolso enviada'); onBack() }
  return <main className="inner-page narrow"><button className="back-button" onClick={onBack}>← Volver a mis reservas</button><div className="page-title"><span className="intro-tag">AYUDA CON TU RESERVA</span><h1>Solicitar un <em>reembolso.</em></h1><p>Contanos qué pasó y revisamos tu solicitud según las condiciones de la sesión.</p></div><form className="form-card" onSubmit={submit}><div className="refund-order"><strong>Paseo por La Boca</strong><small>26 de octubre · 16:00 hs · Voucher ETRIP-8K4M2P</small></div><label>Motivo de la solicitud<select value={reason} onChange={(event) => setReason(event.target.value)} required><option value="">Elegí una opción</option><option>Imprevisto personal</option><option>No puedo asistir</option><option>La experiencia fue cancelada</option><option>Otro motivo</option></select></label><label>Detalle adicional<textarea rows="5" placeholder="Escribí tu mensaje..." /></label><div className="notice">Las solicitudes se revisan antes de confirmar el reintegro.</div><button className="primary-button">Enviar solicitud →</button></form></main>
}

export default Refund

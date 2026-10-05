import { useState } from 'react'

function SessionEditor({ session, onBack, onSave }) {
  const [date, setDate] = useState(session?.date || '')
  const [time, setTime] = useState(session?.time || '')
  const [capacity, setCapacity] = useState(session?.capacity || 12)
  return <main className="inner-page narrow"><button className="back-button" onClick={onBack}>← Volver al calendario</button><div className="page-title"><span className="intro-tag">MODO ANFITRIÓN</span><h1>{session ? 'Editar' : 'Crear'} <em>sesión.</em></h1><p>Definí cuándo ocurre el plan y cuántos lugares hay disponibles.</p></div><form className="form-card" onSubmit={(event) => { event.preventDefault(); onSave({ date, time, capacity: Number(capacity), available: session?.available ?? Number(capacity) }); onBack() }}><label>Fecha<input value={date} onChange={(event) => setDate(event.target.value)} type="date" required /></label><label>Hora<input value={time} onChange={(event) => setTime(event.target.value)} type="time" required /></label><label>Capacidad<input value={capacity} onChange={(event) => setCapacity(event.target.value)} type="number" min="1" required /></label><div className="form-actions"><button type="button" className="outline-button" onClick={onBack}>Cancelar</button><button className="primary-button">Guardar sesión →</button></div></form></main>
}

export default SessionEditor

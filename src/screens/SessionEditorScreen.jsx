import { useState } from 'react'
import FormField, { FormActions } from '../components/FormField'
import ScreenIntro from '../components/ScreenIntro'

function SessionEditor({ session, onBack, onSave }) {
  const [date, setDate] = useState(session?.date || '')
  const [time, setTime] = useState(session?.time || '')
  const [capacity, setCapacity] = useState(session?.capacity || 12)
  return <main className="inner-page narrow"><button className="back-button" onClick={onBack}>← Volver al calendario</button><ScreenIntro eyebrow="MODO ANFITRIÓN" title={session ? 'Editar' : 'Crear'} accent="sesión." description="Definí cuándo ocurre el plan y cuántos lugares hay disponibles." /><form className="form-card" onSubmit={(event) => { event.preventDefault(); onSave({ date, time, capacity: Number(capacity), available: session?.available ?? Number(capacity) }); onBack() }}><FormField label="Fecha" value={date} onChange={(event) => setDate(event.target.value)} type="date" required /><FormField label="Hora" value={time} onChange={(event) => setTime(event.target.value)} type="time" required /><FormField label="Capacidad" value={capacity} onChange={(event) => setCapacity(event.target.value)} type="number" min="1" required /><FormActions onCancel={onBack} submitLabel="Guardar sesión →" /></form></main>
}

export default SessionEditor

import { useState } from 'react'
import { useToast } from '../../hooks/useToast'
import { createSession, updateSession } from '../../services/sessionsService'
import { addHours, daysFromToday, hoursBetween } from '../../utils/dates'
import Button from '../ui/Button'
import FormField from '../ui/FormField'
import Modal from '../ui/Modal'

/** Crear o editar una sesión (fecha, hora, duración y cupo). Le pasa al padre la sesión guardada. */
function SessionFormModal({ session, experiences, defaultExperienceId, onSaved, onClose }) {
  const notify = useToast()
  const booked = session ? session.capacity - session.availableSeats : 0
  const initialStart = session?.startsAt ?? daysFromToday(7, '18:00')

  const [form, setForm] = useState({
    experienceId: session?.experienceId ?? defaultExperienceId ?? experiences[0]?.id,
    date: initialStart.slice(0, 10),
    time: initialStart.slice(11, 16),
    duration: session ? hoursBetween(session.startsAt, session.endsAt) : 2,
    capacity: session?.capacity ?? 10,
  })
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const setField = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  const handleSubmit = (event) => {
    event.preventDefault()
    const capacity = Number(form.capacity)
    const duration = Number(form.duration)
    const startsAt = `${form.date}T${form.time}:00`
    if (new Date(startsAt) < new Date()) return setError('La fecha tiene que ser futura.')
    if (!(duration > 0)) return setError('La duración tiene que ser mayor a 0.')
    if (capacity < Math.max(1, booked)) return setError(`El cupo no puede ser menor a ${Math.max(1, booked)} (lugares ya reservados).`)

    // Mismos campos que ExperienceSessionRequestDTO
    const data = { experienceId: Number(form.experienceId), startsAt, endsAt: addHours(startsAt, duration), capacity }
    const request = session ? updateSession(session.id, data) : createSession(data)

    setSending(true)
    return request
      .then((saved) => {
        onSaved(saved)
        notify(session ? 'Sesión actualizada' : 'Nueva fecha publicada')
        onClose()
      })
      .catch((saveError) => {
        setError(saveError.message)
        setSending(false)
      })
  }

  return (
    <Modal
      title={session ? 'Editar sesión' : 'Nueva sesión'}
      description="Definí cuándo ocurre el plan y cuántos lugares ofrecés."
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="session-form" disabled={sending}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="session-form" className="stack" onSubmit={handleSubmit}>
        <FormField as="select" label="Experiencia" value={form.experienceId} onChange={setField('experienceId')} disabled={Boolean(session)}>
          {experiences.map((experience) => (
            <option key={experience.id} value={experience.id}>
              {experience.title}
            </option>
          ))}
        </FormField>
        <div className="form-grid">
          <FormField label="Fecha" type="date" value={form.date} onChange={setField('date')} required />
          <FormField label="Hora de inicio" type="time" value={form.time} onChange={setField('time')} required />
          <FormField label="Duración (horas)" type="number" min="0.5" step="0.5" value={form.duration} onChange={setField('duration')} required />
          <FormField
            label="Cupo"
            type="number"
            min={Math.max(1, booked)}
            value={form.capacity}
            onChange={setField('capacity')}
            hint={booked ? `Ya hay ${booked} lugares reservados.` : undefined}
            required
          />
        </div>
        {error && <p className="form-error">{error}</p>}
      </form>
    </Modal>
  )
}

export default SessionFormModal

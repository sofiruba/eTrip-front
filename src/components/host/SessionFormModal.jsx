import { useState } from 'react'
import { addHours, daysFromToday } from '../../data/dates'
import { useStore } from '../../hooks/useStore'
import { useToast } from '../../hooks/useToast'
import Button from '../ui/Button'
import FormField from '../ui/FormField'
import Modal from '../ui/Modal'

/** Crear o editar una sesión (fecha, hora y cupo). */
function SessionFormModal({ session, experiences, defaultExperienceId, onClose }) {
  const { create, update } = useStore()
  const notify = useToast()
  const booked = session ? session.capacity - session.availableSeats : 0
  const initialStart = session?.startsAt ?? daysFromToday(7, '18:00')

  const [form, setForm] = useState({
    experienceId: session?.experienceId ?? defaultExperienceId ?? experiences[0]?.id,
    date: initialStart.slice(0, 10),
    time: initialStart.slice(11, 16),
    capacity: session?.capacity ?? 10,
    active: session?.active ?? true,
  })
  const [error, setError] = useState('')
  const setField = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  const handleSubmit = (event) => {
    event.preventDefault()
    const capacity = Number(form.capacity)
    const startsAt = `${form.date}T${form.time}:00`
    if (new Date(startsAt) < new Date()) return setError('La fecha tiene que ser futura.')
    if (capacity < Math.max(1, booked)) return setError(`El cupo no puede ser menor a ${Math.max(1, booked)} (lugares ya reservados).`)

    const experience = experiences.find((entry) => entry.id === Number(form.experienceId))
    const data = {
      experienceId: experience.id,
      startsAt,
      endsAt: addHours(startsAt, experience.durationHours),
      capacity,
      availableSeats: capacity - booked,
      active: form.active,
    }

    if (session) update('sessions', session.id, data)
    else create('sessions', data)
    notify(session ? 'Sesión actualizada' : 'Nueva fecha publicada')
    return onClose()
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
          <Button type="submit" form="session-form">
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
        </div>
        <FormField
          label="Cupo"
          type="number"
          min={Math.max(1, booked)}
          value={form.capacity}
          onChange={setField('capacity')}
          hint={booked ? `Ya hay ${booked} lugares reservados.` : undefined}
          required
        />
        <label className="checkbox">
          <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
          Sesión visible para reservar
        </label>
        {error && <p className="form-error">{error}</p>}
      </form>
    </Modal>
  )
}

export default SessionFormModal

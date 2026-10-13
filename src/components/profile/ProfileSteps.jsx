import { Check } from 'lucide-react'
import './ProfileSteps.css'

const MIN_INTERESTS = 2

/** Pasos para completar el perfil; cada uno dice qué hacer si falta. */
function getProfileSteps(user) {
  return [
    { id: 'foto', label: 'Subí una foto', done: Boolean(user.avatarUrl) },
    { id: 'bio', label: 'Contá algo sobre vos', done: Boolean(user.bio?.trim()) },
    { id: 'ciudad', label: 'Indicá tu ciudad', done: Boolean(user.city?.trim()) },
    { id: 'intereses', label: `Elegí ${MIN_INTERESTS} intereses`, done: (user.interests?.length ?? 0) >= MIN_INTERESTS },
  ]
}

/** Barra de "Completá tu perfil". Al tocar un paso pendiente avisa cuál (onStep). No se muestra si está todo hecho. */
function ProfileSteps({ user, onStep }) {
  const steps = getProfileSteps(user)
  const done = steps.filter((step) => step.done).length
  if (done === steps.length) return null

  return (
    <section className="section card profile-steps">
      <div className="profile-steps__header">
        <div>
          <h2>Completá tu perfil</h2>
          <p className="muted small">Un perfil completo genera más confianza en anfitriones y otros viajeros.</p>
        </div>
        <span className="profile-steps__count">
          {done} de {steps.length}
        </span>
      </div>
      <div className="profile-steps__bar" aria-hidden>
        <span style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      <ul className="profile-steps__list">
        {steps.map((step) => (
          <li key={step.id} className={step.done ? 'is-done' : ''}>
            {step.done ? (
              <span>
                <Check size={16} aria-hidden />
                {step.label}
              </span>
            ) : (
              <button type="button" onClick={() => onStep(step.id)}>
                {step.label}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default ProfileSteps

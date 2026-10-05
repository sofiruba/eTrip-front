import { useState } from 'react'

function EditProfile({ user, onBack, onSave }) {
  const [name, setName] = useState(user?.name || 'Sofía Rubachin')
  const [email, setEmail] = useState(user?.email || 'sofia@plan.com')
  return <main className="inner-page"><button className="back-button" onClick={onBack}>← Volver a mi perfil</button><div className="page-title"><span className="intro-tag">TU CUENTA</span><h1>Editá tu <em>perfil.</em></h1><p>Actualizá tus datos para que PLAN te conozca un poquito mejor.</p></div><form className="form-card profile-edit-form" onSubmit={(event) => { event.preventDefault(); onSave({ ...user, name, email }); onBack() }}><label>Nombre completo<input value={name} onChange={(event) => setName(event.target.value)} required /></label><label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required /></label><label>Bio<textarea placeholder="Contale algo a la comunidad..." rows="4" /></label><div className="form-actions"><button type="button" className="outline-button" onClick={onBack}>Cancelar</button><button className="primary-button">Guardar cambios →</button></div></form></main>
}

export default EditProfile

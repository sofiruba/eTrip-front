import { useState } from 'react'
import FormField, { FormActions } from '../components/FormField'
import ScreenIntro from '../components/ScreenIntro'

function EditProfile({ user, onBack, onSave }) {
  const [name, setName] = useState(user?.name || 'Sofía Rubachin')
  const [email, setEmail] = useState(user?.email || 'sofia@plan.com')
  return <main className="inner-page"><button className="back-button" onClick={onBack}>← Volver a mi perfil</button><ScreenIntro eyebrow="TU CUENTA" title="Editá tu" accent="perfil." description="Actualizá tus datos para que PLAN te conozca un poquito mejor." /><form className="form-card profile-edit-form" onSubmit={(event) => { event.preventDefault(); onSave({ ...user, name, email }); onBack() }}><FormField label="Nombre completo" value={name} onChange={(event) => setName(event.target.value)} required /><FormField label="Email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" required /><FormField as="textarea" label="Bio" placeholder="Contale algo a la comunidad..." rows="4" /><FormActions onCancel={onBack} /></form></main>
}

export default EditProfile

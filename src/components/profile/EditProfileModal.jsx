import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import Button from '../ui/Button'
import FormField from '../ui/FormField'
import Modal from '../ui/Modal'

const MAX_BIO = 500

/** Mismos campos que UserUpdateDTO del back (el email no se puede cambiar). */
function EditProfileModal({ onClose }) {
  const { user, updateProfile } = useAuth()
  const notify = useToast()
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    city: user.city ?? '',
    bio: user.bio ?? '',
  })
  const setField = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  const handleSubmit = (event) => {
    event.preventDefault()
    updateProfile({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      city: form.city.trim(),
      bio: form.bio.trim(),
    })
    notify('Perfil actualizado')
    onClose()
  }

  return (
    <Modal
      title="Editar perfil"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="profile-form">
            Guardar cambios
          </Button>
        </>
      }
    >
      <form id="profile-form" className="stack" onSubmit={handleSubmit}>
        <div className="form-grid">
          <FormField label="Nombre" value={form.firstName} onChange={setField('firstName')} required />
          <FormField label="Apellido" value={form.lastName} onChange={setField('lastName')} required />
        </div>
        <FormField label="Email" type="email" value={user.email} readOnly disabled hint="El email no se puede cambiar." />
        <FormField label="Ciudad" value={form.city} onChange={setField('city')} />
        <FormField
          as="textarea"
          label="Sobre vos"
          rows={4}
          value={form.bio}
          onChange={setField('bio')}
          maxLength={MAX_BIO}
          placeholder="Contale algo a la comunidad..."
          hint={`Se muestra en tu perfil público si publicás experiencias. ${form.bio.length}/${MAX_BIO}`}
        />
      </form>
    </Modal>
  )
}

export default EditProfileModal

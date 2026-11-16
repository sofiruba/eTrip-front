import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { updateMe } from '../../redux/authSlice'
import { showToast } from '../../redux/toastsSlice'
import Button from '../ui/Button'
import FormField from '../ui/FormField'
import Modal from '../ui/Modal'

const MAX_BIO = 500

/** Editar perfil: nombre, apellido, ciudad y bio (PUT /users/me). El email no se puede cambiar. */
function EditProfileModal({ onClose }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    city: user.city ?? '',
    bio: user.bio ?? '',
  })
  const [sending, setSending] = useState(false)
  const setField = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  // Todo se guarda en el back; el reducer guarda el usuario que devuelve (bio y ciudad se ven en el perfil público)
  const handleSubmit = (event) => {
    event.preventDefault()
    setSending(true)
    dispatch(updateMe({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), city: form.city.trim(), bio: form.bio.trim() }))
      .then((action) => {
        // rejected: el back respondió con un error (action.error.message, como en el reducer)
        if (action.error) {
          dispatch(showToast({ message: action.error.message, tone: 'error' }))
          setSending(false)
          return
        }
        dispatch(showToast({ message: 'Perfil actualizado' }))
        onClose()
      })
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
          <Button type="submit" form="profile-form" disabled={sending}>
            {sending ? 'Guardando…' : 'Guardar cambios'}
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
        <FormField label="Ciudad" value={form.city} onChange={setField('city')} maxLength={100} />
        <FormField
          as="textarea"
          label="Sobre vos"
          rows={4}
          value={form.bio}
          onChange={setField('bio')}
          maxLength={MAX_BIO}
          placeholder="Contale algo a la comunidad..."
          hint={`Se muestra en tu perfil público y en tus experiencias. ${form.bio.length}/${MAX_BIO}`}
        />
      </form>
    </Modal>
  )
}

export default EditProfileModal

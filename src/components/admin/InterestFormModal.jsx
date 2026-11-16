import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { createInterest, updateInterest } from '../../redux/interestsSlice'
import { showToast } from '../../redux/toastsSlice'
import Button from '../ui/Button'
import FormField from '../ui/FormField'
import Modal from '../ui/Modal'

/**
 * Crear (POST) o editar (PUT) un interés. El back valida que el nombre no se repita y que la categoría exista;
 * el reducer lo agrega o lo reemplaza en el store y el registro, el perfil y el editor lo ven al instante.
 */
function InterestFormModal({ interest, categories, onClose }) {
  const dispatch = useDispatch()
  const [name, setName] = useState(interest?.name ?? '')
  const [categoryId, setCategoryId] = useState(String(interest?.categoryId ?? categories[0]?.id ?? ''))
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false) // evita crear el mismo interés dos veces

  const handleSubmit = (event) => {
    event.preventDefault()
    const data = { name: name.trim(), categoryId: Number(categoryId) }
    setSending(true)
    const request = interest
      ? dispatch(updateInterest({ id: interest.id, previousName: interest.name, ...data }))
      : dispatch(createInterest(data))
    return request.then((action) => {
      // rejected: el back respondió con un error (action.error.message, como en el reducer)
      if (action.error) {
        setError(action.error.message)
        setSending(false)
        return
      }
      dispatch(showToast({ message: interest ? 'Interés actualizado' : 'Interés creado' }))
      onClose()
    })
  }

  return (
    <Modal
      title={interest ? 'Editar interés' : 'Nuevo interés'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="interest-form" disabled={sending}>
            {sending ? 'Guardando…' : 'Guardar'}
          </Button>
        </>
      }
    >
      <form id="interest-form" className="stack" onSubmit={handleSubmit}>
        <FormField
          label="Nombre"
          value={name}
          error={error}
          placeholder="Ej: Escalada"
          required
          onChange={(event) => {
            setName(event.target.value)
            setError('')
          }}
        />
        <FormField
          as="select"
          label="Categoría"
          hint="Es el grupo en el que aparece cuando alguien elige sus intereses."
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </FormField>
      </form>
    </Modal>
  )
}

export default InterestFormModal

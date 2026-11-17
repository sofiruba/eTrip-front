import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { createCategory, updateCategory } from '../../redux/categoriesSlice'
import { showToast } from '../../redux/toastsSlice'
import Button from '../ui/Button'
import FormField from '../ui/FormField'
import Modal from '../ui/Modal'

/**
 * Crear (POST) o editar (PUT) una categoría. El reducer la agrega o la reemplaza en el store:
 * la tabla del panel, los filtros del catálogo y el editor la ven al instante, sin volver a pedirla.
 */
function CategoryFormModal({ category, onClose }) {
  const dispatch = useDispatch()
  const [name, setName] = useState(category?.name ?? '')
  const [description, setDescription] = useState(category?.description ?? '')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false) // evita crear la misma categoría dos veces

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('Ingresá un nombre.')

    const data = { name: trimmed, description: description.trim() }
    setSending(true)
    const request = category ? dispatch(updateCategory({ id: category.id, ...data })) : dispatch(createCategory(data))
    return request
      .then((action) => {
        if (action.error) {
          setError(action.error.message)
          setSending(false)
          return
        }
        dispatch(showToast({ message: category ? 'Categoría actualizada' : 'Categoría creada' }))
        onClose()
      })
  }

  return (
    <Modal
      title={category ? 'Editar categoría' : 'Nueva categoría'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="category-form" disabled={sending}>
            {sending ? 'Guardando…' : 'Guardar'}
          </Button>
        </>
      }
    >
      <form id="category-form" className="stack" onSubmit={handleSubmit}>
        <FormField
          label="Nombre"
          value={name}
          error={error}
          placeholder="Ej: Gastronomía"
          onChange={(event) => {
            setName(event.target.value)
            setError('')
          }}
        />
        <FormField
          as="textarea"
          label="Descripción"
          rows={3}
          value={description}
          placeholder="Qué tipo de planes incluye..."
          onChange={(event) => setDescription(event.target.value)}
        />
      </form>
    </Modal>
  )
}

export default CategoryFormModal

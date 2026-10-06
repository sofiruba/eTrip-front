import { useState } from 'react'
import { useStore } from '../../hooks/useStore'
import { useToast } from '../../hooks/useToast'
import Button from '../ui/Button'
import FormField from '../ui/FormField'
import Modal from '../ui/Modal'

function CategoryFormModal({ category, onClose }) {
  const { db, create, update } = useStore()
  const notify = useToast()
  const [name, setName] = useState(category?.name ?? '')
  const [description, setDescription] = useState(category?.description ?? '')
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('Ingresá un nombre.')
    // Igual que CategoryDuplicateException en el back
    const duplicated = db.categories.some((entry) => entry.name.toLowerCase() === trimmed.toLowerCase() && entry.id !== category?.id)
    if (duplicated) return setError('Ya existe una categoría con ese nombre.')

    const data = { name: trimmed, description: description.trim() }
    if (category) update('categories', category.id, data)
    else create('categories', data)
    notify(category ? 'Categoría actualizada' : 'Categoría creada')
    return onClose()
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
          <Button type="submit" form="category-form">
            Guardar
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

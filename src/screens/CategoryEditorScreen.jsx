import { useState } from 'react'
import FormField, { FormActions } from '../components/FormField'
import ScreenIntro from '../components/ScreenIntro'

function CategoryEditor({ category = '', onBack, onSave }) {
  const [name, setName] = useState(category)
  const [description, setDescription] = useState('')
  return <main className="inner-page narrow"><button className="back-button" onClick={onBack}>← Volver a categorías</button><ScreenIntro eyebrow="ADMINISTRACIÓN" title={category ? 'Editar' : 'Crear'} accent="categoría." description="Organizá las experiencias para que sea más fácil descubrirlas." /><form className="form-card" onSubmit={(event) => { event.preventDefault(); onSave(name); onBack() }}><FormField label="Nombre" value={name} onChange={(event) => setName(event.target.value)} required placeholder="Ej: Gastronomía" /><FormField as="textarea" label="Descripción" value={description} onChange={(event) => setDescription(event.target.value)} required rows="4" placeholder="Contá qué tipo de planes incluye..." /><FormActions onCancel={onBack} submitLabel="Guardar categoría →" /></form></main>
}

export default CategoryEditor

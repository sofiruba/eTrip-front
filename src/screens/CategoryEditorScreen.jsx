import { useState } from 'react'

function CategoryEditor({ category = '', onBack, onSave }) {
  const [name, setName] = useState(category)
  const [description, setDescription] = useState('')
  return <main className="inner-page narrow"><button className="back-button" onClick={onBack}>← Volver a categorías</button><div className="page-title"><span className="intro-tag">ADMINISTRACIÓN</span><h1>{category ? 'Editar' : 'Crear'} <em>categoría.</em></h1><p>Organizá las experiencias para que sea más fácil descubrirlas.</p></div><form className="form-card" onSubmit={(event) => { event.preventDefault(); onSave(name); onBack() }}><label>Nombre<input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Ej: Gastronomía" /></label><label>Descripción<textarea value={description} onChange={(event) => setDescription(event.target.value)} required rows="4" placeholder="Contá qué tipo de planes incluye..." /></label><div className="form-actions"><button type="button" className="outline-button" onClick={onBack}>Cancelar</button><button className="primary-button">Guardar categoría →</button></div></form></main>
}

export default CategoryEditor

import { useState } from 'react'
import ManagementHeader from '../components/ManagementHeader'

function ExperienceEditorScreen({ onBack, onNotify, editing = false }) {
  const [saved, setSaved] = useState(false)
  const [photos, setPhotos] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const selectPhotos = (event) => {
    const nextPhotos = Array.from(event.target.files || []).map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }))
    setPhotos((current) => [...current, ...nextPhotos].slice(0, 5))
  }

  const submit = (event) => {
    event.preventDefault()
    setSaved(true)
    onNotify('Experiencia guardada como borrador')
  }

  return (
    <main className="inner-page experience-editor-page">
      <button className="back-button" onClick={onBack}>← Volver al modo anfitrión</button>
      <ManagementHeader eyebrow={editing ? 'EDITAR EXPERIENCIA' : 'NUEVA EXPERIENCIA'} title={editing ? 'Editá tu experiencia.' : 'Creá algo inolvidable.'} description="Contá qué hace especial a tu plan y ayudá a otras personas a encontrarlo." />
      <div className="editor-layout">
        <form className="editor-card airbnb-editor" onSubmit={submit}>
          <section className="editor-section">
            <div className="editor-section-heading"><span>01</span><div><h2>Mostrá tu experiencia</h2><p>Las fotos son lo primero que van a ver.</p></div></div>
            <label className="photo-dropzone"><input type="file" accept="image/*" multiple onChange={selectPhotos} /><span className="upload-icon">↑</span><strong>Subí fotos de tu experiencia</strong><small>Agregá hasta 5 imágenes · JPG o PNG</small><em>Elegir archivos</em></label>
            {photos.length > 0 && <div className="photo-previews">{photos.map((photo) => <img src={photo.url} alt={photo.name} key={photo.url} />)}</div>}
          </section>
          <section className="editor-section">
            <div className="editor-section-heading"><span>02</span><div><h2>Contá tu plan</h2><p>Una buena historia invita a sumarse.</p></div></div>
            <label>Título<input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Ej: Paseo por La Boca y vermut" /></label>
            <label>Descripción<textarea value={description} onChange={(event) => setDescription(event.target.value)} required placeholder="¿Qué van a hacer? ¿Qué hace única esta experiencia?" rows="5" /></label>
            <div className="form-grid"><label>Categoría<select><option>Gastronomía</option><option>Arte</option><option>Fotografía</option><option>Naturaleza</option><option>Música</option></select></label><label>Ubicación<input required placeholder="Palermo, CABA" /></label></div>
          </section>
          <section className="editor-section">
            <div className="editor-section-heading"><span>03</span><div><h2>Definí el precio</h2><p>Podés modificarlo cuando quieras.</p></div></div>
            <div className="form-grid"><label>Precio por persona<input type="number" min="0" placeholder="$ 28.000" /></label><label>Descuento opcional<input type="number" min="0" max="100" placeholder="10 %" /></label></div>
          </section>
          {saved && <div className="notice">✓ El borrador se guardó correctamente.</div>}
          <div className="form-actions"><button type="button" className="outline-button" onClick={onBack}>Cancelar</button><button className="primary-button" type="submit">Guardar experiencia →</button></div>
        </form>
        <aside className="editor-preview"><span className="eyebrow">VISTA PREVIA</span><h2>Así se va a ver tu experiencia</h2><div className="preview-card"><div className="preview-image">{photos[0] ? <img src={photos[0].url} alt="" /> : <span>Tu foto principal</span>}</div><div className="preview-content"><span className="category-label">TU CATEGORÍA</span><h3>{title || 'El título de tu experiencia'}</h3><p>{description || 'Una descripción que invite a las personas a descubrir tu plan.'}</p><div><strong>$ 28.000</strong><small>/ persona</small></div></div></div><p className="preview-hint">Podés revisar el resultado antes de publicar.</p></aside>
      </div>
    </main>
  )
}

export default ExperienceEditorScreen

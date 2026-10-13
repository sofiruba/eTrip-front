import './EditorSection.css'

/** Bloque numerado del editor ("01 Fotos", "02 Contá tu plan"...). */
function EditorSection({ step, title, description, children }) {
  return (
    <section className="card editor-section">
      <header className="editor-section__header">
        <span>{step}</span>
        <div>
          <h2>{title}</h2>
          <p className="muted small">{description}</p>
        </div>
      </header>
      {children}
    </section>
  )
}

export default EditorSection

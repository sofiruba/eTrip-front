/** Encabezado de sección: eyebrow + título a la izquierda, acciones (children) a la derecha. */
function SectionHeader({ eyebrow, title, description, children }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {description && <p className="muted small">{description}</p>}
      </div>
      {children}
    </div>
  )
}

export default SectionHeader

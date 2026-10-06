import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import './PageHeader.css'

/**
 * Encabezado de página: link de volver, eyebrow, título con acento y acciones.
 * Reemplaza a los .page-title / ScreenIntro / ManagementHeader copiados en cada pantalla.
 */
function PageHeader({ eyebrow, title, accent, description, actions, back }) {
  return (
    <header className="page-header">
      {back && (
        <Link className="page-header__back" to={back.to}>
          <ArrowLeft size={16} aria-hidden />
          {back.label}
        </Link>
      )}
      <div className="page-header__row">
        <div className="page-header__text">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1>
            {title} {accent && <em>{accent}</em>}
          </h1>
          {description && <p className="page-header__description">{description}</p>}
        </div>
        {actions && <div className="page-header__actions">{actions}</div>}
      </div>
    </header>
  )
}

export default PageHeader

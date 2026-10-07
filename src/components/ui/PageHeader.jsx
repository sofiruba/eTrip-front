import { ArrowLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import './PageHeader.css'

/**
 * Encabezado de página: link de volver (o migas de pan), eyebrow, título con acento y acciones.
 * breadcrumbs: [{ label, to }]; el último es la página actual y va sin link.
 */
function PageHeader({ eyebrow, title, accent, description, actions, back, breadcrumbs }) {
  return (
    <header className="page-header">
      {breadcrumbs ? (
        <nav className="breadcrumbs" aria-label="Migas de pan">
          <ol>
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.label}>
                {index > 0 && <ChevronRight size={14} aria-hidden />}
                {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : <span aria-current="page">{crumb.label}</span>}
              </li>
            ))}
          </ol>
        </nav>
      ) : back && (
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

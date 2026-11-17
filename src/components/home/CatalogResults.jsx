import { SearchX, ServerCrash } from 'lucide-react'
import { useSelector } from 'react-redux'
import ExperienceCard from '../experience/ExperienceCard'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'
import Loading from '../ui/Loading'
import './CatalogResults.css'

/**
 * Grilla de resultados del catálogo con sus estados: cargando, error, vacío y "Cargar más".
 * `visible` son las que se muestran ahora; `total`, cuántas encontró la búsqueda.
 */
function CatalogResults({ loading, error, onRetry, visible, total, location, placeIsEmpty, cardLink, onMore, onClear }) {
  const isAdmin = useSelector((state) => state.auth.user?.role === 'ADMIN')
  if (loading) return <Loading text="Buscando experiencias..." />

  if (error) {
    return (
      <EmptyState icon={ServerCrash} title="No pudimos cargar las experiencias" text={error}>
        <Button variant="secondary" onClick={onRetry}>
          Reintentar
        </Button>
      </EmptyState>
    )
  }

  // Si se buscó una ciudad donde todavía no hay nada, el vacío invita a publicar
  if (!total && placeIsEmpty) {
    return (
      <EmptyState
        icon={SearchX}
        title={`Todavía no hay planes en ${location}`}
        text={isAdmin ? 'Probá con otra ciudad o mirá todo el catálogo.' : '¿Sos de ahí? Podés publicar la primera experiencia.'}
      >
        {!isAdmin && <Button to="/anfitrion/experiencias/nueva">Publicar una experiencia</Button>}
        <Button variant="secondary" onClick={onClear}>
          Ver todas
        </Button>
      </EmptyState>
    )
  }

  if (!total) {
    return (
      <EmptyState icon={SearchX} title="No encontramos ese plan" text="Probá con otras fechas o sacando algún filtro.">
        <Button variant="secondary" onClick={onClear}>
          Limpiar filtros
        </Button>
      </EmptyState>
    )
  }

  return (
    <>
      <div className="experience-grid catalog-results">
        {visible.map((experience) => (
          <ExperienceCard key={experience.id} experience={experience} to={cardLink(experience)} />
        ))}
      </div>
      {visible.length < total && (
        <div className="catalog-results__more">
          <p className="muted small">
            Viendo {visible.length} de {total}
          </p>
          <Button variant="secondary" onClick={onMore}>
            Cargar más
          </Button>
        </div>
      )}
    </>
  )
}

export default CatalogResults

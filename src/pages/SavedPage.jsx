import { useEffect } from 'react'
import { Heart } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import ExperienceCard from '../components/experience/ExperienceCard'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import Loading from '../components/ui/Loading'
import PageHeader from '../components/ui/PageHeader'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { fetchFavorites } from '../redux/favoritesSlice'
import { isMissing } from '../redux/helpers'
import { addSessionInfo } from '../utils/experiences'
import { pluralize } from '../utils/format'

/** Guardados: los ids vienen del slice favorites (back) y las tarjetas, del catálogo que ya está en el store. */
function SavedPage() {
  useDocumentTitle('Guardados')
  const dispatch = useDispatch()
  const favorites = useSelector((state) => state.favorites) // { ids, loaded, error }
  const catalog = useSelector((state) => state.experiences)
  const sessions = useSelector((state) => state.sessions.items)

  // App.jsx ya los pide al iniciar sesión; esto cubre si se entra directo. Si falló, se reintenta con el botón
  useEffect(() => {
    if (isMissing(favorites)) dispatch(fetchFavorites())
  }, [favorites, dispatch])

  const experiences = addSessionInfo(catalog.items, sessions)
  // En el orden en que se guardaron (la última primero). Una guardada que el anfitrión pausó no está en el catálogo: no se muestra
  const saved = favorites.ids.map((id) => experiences.find((experience) => experience.id === id)).filter(Boolean)
  const hidden = favorites.ids.length - saved.length

  return (
    <div className="container page">
      <PageHeader eyebrow="Mi actividad" title="Mis" accent="guardados." description="Las experiencias que marcaste con el corazón, para decidir con tiempo." />

      {favorites.error ? (
        <ErrorState title="No pudimos cargar tus guardados" message={favorites.error} onRetry={() => dispatch(fetchFavorites())} />
      ) : !favorites.loaded || !catalog.loaded ? (
        <Loading />
      ) : saved.length ? (
        <>
          <div className="experience-grid">
            {saved.map((experience) => (
              <ExperienceCard key={experience.id} experience={experience} />
            ))}
          </div>
          {hidden > 0 && (
            <p className="muted small section">
              {pluralize(hidden, 'guardada', 'guardadas')} no se {hidden === 1 ? 'muestra' : 'muestran'} porque el anfitrión la pausó.
            </p>
          )}
        </>
      ) : (
        <EmptyState icon={Heart} title="Todavía no guardaste nada" text="Tocá el corazón de una experiencia para encontrarla acá después.">
          <Button to="/">Explorar experiencias</Button>
        </EmptyState>
      )}
    </div>
  )
}

export default SavedPage

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CatalogContext } from '../hooks/useCatalog'
import { getCategories } from '../services/categoriesService'
import { getExperiences } from '../services/experiencesService'
import { getSessions } from '../services/sessionsService'
import { addSessionInfo } from '../utils/experiences'

/**
 * Catálogo público (experiencias activas, sus fechas futuras y las categorías).
 * Se pide al back UNA vez cuando se monta la app y queda guardado acá: Home, detalle, carrito,
 * checkout, perfil y el buscador lo leen sin volver a pedirlo cada vez que se cambia de vista.
 * Cuando algo cambia en el back (se publica una experiencia, se compra, se cancela una fecha)
 * se llama a `reload` o a `refreshSessions` para actualizarlo.
 */
function CatalogProvider({ children }) {
  const [experiences, setExperiences] = useState([])
  const [sessions, setSessions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Promise.all espera las tres respuestas: recién ahí termina la carga (si una falla, falla todo junto)
  const reload = useCallback(
    () =>
      Promise.all([getExperiences(), getSessions(), getCategories()])
        .then(([experiencesData, sessionsData, categoriesData]) => {
          setExperiences(experiencesData)
          setSessions(sessionsData)
          setCategories(categoriesData)
          setError('')
        })
        .catch((loadError) => setError(loadError.message))
        .then(() => setLoading(false)),
    [],
  )

  // Solo las fechas (son livianas): para tener los lugares que quedan al entrar al carrito o después de comprar
  const refreshSessions = useCallback(
    () =>
      getSessions()
        .then((data) => setSessions(data))
        .catch((sessionsError) => console.error('Error al actualizar las fechas:', sessionsError)),
    [],
  )

  // Montaje: GET con array de dependencias vacío (reload no cambia nunca)
  useEffect(() => {
    reload()
  }, [reload])

  const value = useMemo(
    () => ({
      experiences: addSessionInfo(experiences, sessions),
      sessions,
      categories,
      loading,
      error,
      reload,
      refreshSessions,
    }),
    [experiences, sessions, categories, loading, error, reload, refreshSessions],
  )

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export default CatalogProvider

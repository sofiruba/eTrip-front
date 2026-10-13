import { useEffect, useState } from 'react'
import { getCategories } from '../services/categoriesService'
import { getExperiences } from '../services/experiencesService'
import { getSessions } from '../services/sessionsService'
import { addSessionInfo } from '../utils/experiences'

/**
 * Trae el catálogo cuando el componente se monta (GET, array de dependencias vacío).
 * Lo usan las páginas que muestran experiencias con sus fechas: Home, carrito, checkout, perfil.
 */
export function useCatalog() {
  const [experiences, setExperiences] = useState([])
  const [sessions, setSessions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getExperiences()
      .then((data) => setExperiences(data))
      .catch((error) => setError(error.message))
      .then(() => setLoading(false))

    getSessions()
      .then((data) => setSessions(data))
      .catch((error) => console.error('Error al traer las fechas:', error))

    getCategories()
      .then((data) => setCategories(data))
      .catch((error) => console.error('Error al traer las categorías:', error))
  }, [])

  return {
    // Cada experiencia ya viene con su próxima fecha y los lugares que quedan
    experiences: addSessionInfo(experiences, sessions),
    sessions,
    categories,
    loading,
    error,
  }
}

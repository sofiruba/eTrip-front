import { useState } from 'react'
import { useParams } from 'react-router-dom'

/**
 * Monta la página de nuevo (estado limpio y nuevos pedidos al back) cuando cambia el `:id` de la URL
 * o cuando la página pide reintentar (`onRetry`). Lo hace cambiando la `key`: para React es otro componente.
 * Así una respuesta vieja no pisa a la nueva y, por ejemplo, ir de "editar" a "nueva" no arrastra el formulario.
 */
function RemountOnParam({ page: Page }) {
  const { id } = useParams()
  const [attempt, setAttempt] = useState(0)
  return <Page key={`${id ?? 'nuevo'}:${attempt}`} onRetry={() => setAttempt((current) => current + 1)} />
}

export default RemountOnParam

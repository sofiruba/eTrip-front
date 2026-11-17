import { useParams } from 'react-router-dom'

/**
 * Monta la página de nuevo (estado limpio) cuando cambia el `:id` de la URL, cambiando la `key`: para React
 * es otro componente. Así, por ejemplo, ir de "editar" a "nueva" no arrastra el formulario.
 */
function RemountOnParam({ page: Page }) {
  const { id } = useParams()
  return <Page key={id ?? 'nuevo'} />
}

export default RemountOnParam

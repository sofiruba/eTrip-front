import { useEffect } from 'react'

const BRAND = 'PLAN'
const DEFAULT_TITLE = `${BRAND} · Experiencias en Buenos Aires`

/** Título de la pestaña. Con `null` se usa el título por defecto. */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${BRAND}` : DEFAULT_TITLE
  }, [title])
}

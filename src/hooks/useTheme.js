import { useEffect, useState } from 'react'
import { usePersistentState } from './usePersistentState'

const DARK_QUERY = '(prefers-color-scheme: dark)'

/**
 * Tema claro/oscuro. Por defecto sigue al sistema (theme = null);
 * si el usuario elige uno, se guarda y se marca con data-theme en <html>.
 * index.html aplica el tema guardado antes de pintar para evitar el parpadeo.
 */
export function useTheme() {
  const [theme, setTheme] = usePersistentState('plan:theme', null)
  const [systemDark, setSystemDark] = useState(() => window.matchMedia?.(DARK_QUERY).matches ?? false)

  useEffect(() => {
    const media = window.matchMedia?.(DARK_QUERY)
    if (!media) return undefined
    const update = (event) => setSystemDark(event.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme
    else delete document.documentElement.dataset.theme
  }, [theme])

  const isDark = theme ? theme === 'dark' : systemDark
  return { isDark, toggle: () => setTheme(isDark ? 'light' : 'dark') }
}

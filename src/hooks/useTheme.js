import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setTheme } from '../redux/preferencesSlice'

const DARK_QUERY = '(prefers-color-scheme: dark)'

/**
 * Tema claro/oscuro. Lo que eligió el usuario vive en el estado global (preferences.theme, persistido);
 * null = sigue al sistema. Los efectos escuchan el tema del sistema y lo aplican con data-theme en <html>.
 * index.html aplica el tema guardado antes de pintar para evitar el parpadeo.
 */
export function useTheme() {
  const dispatch = useDispatch()
  const theme = useSelector((state) => state.preferences.theme)
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
  return { isDark, toggle: () => dispatch(setTheme(isDark ? 'light' : 'dark')) }
}

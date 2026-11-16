import axios from 'axios'

/**
 * Cliente HTTP con axios: lo usan TODAS las acciones asíncronas (createAsyncThunk) de los slices.
 * Igual que en clase: `const { data } = await api.get(URL)` y la acción devuelve `data`.
 *
 * Una sola instancia para todo el front, así no repetimos en cada slice:
 *  - la URL base del back,
 *  - el token (que vive en el estado global, slice `auth`) en el header Authorization,
 *  - el mensaje de error que manda el back ({ message }).
 */

// URL base del back. En desarrollo es localhost; al desplegar (Vercel) se define VITE_API_URL (ver .env.example).
export const API_URL = import.meta.env?.VITE_API_URL ?? 'http://localhost:4002'

export const api = axios.create({ baseURL: API_URL })

/** Header con un token puntual: el que acaba de devolver el login (todavía no está en el estado global). */
export const withToken = (token) => ({ headers: { Authorization: `Bearer ${token}` } })

/** Los listados del back vienen paginados ({ content: [...] }): esto devuelve solo la lista. */
export const listOf = (data) => (Array.isArray(data) ? data : (data?.content ?? []))

/** true si el token ya venció. El JWT trae su vencimiento (`exp`, en segundos) en la parte del medio, en base64. */
export function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

/**
 * Error del back → Error de JavaScript con el mensaje que mandó el back y el status HTTP en `code`.
 * createAsyncThunk atrapa este error solo (por eso en los thunks no hay try/catch) y lo deja en
 * `action.error`, del que Redux guarda `message` y `code`. Así el reducer hace `state.error = action.error.message`.
 */
function toApiError(error) {
  if (!error.response) {
    return new Error('No pudimos conectarnos con el servidor. Revisá tu conexión y probá de nuevo.')
  }
  const { status, data } = error.response
  const apiError = new Error(data?.message || 'Ocurrió un error. Probá de nuevo.')
  apiError.code = String(status) // Redux solo conserva `code` si es texto
  return apiError
}

/**
 * Conecta axios con el store. Se llama una sola vez desde store.js: así este archivo no importa el store
 * (no hay import circular) y lee el token del estado global en cada pedido.
 * `onSessionExpired` se ejecuta si el token venció mientras se usaba la app.
 */
export function setupInterceptors(store, onSessionExpired) {
  api.interceptors.request.use((config) => {
    // Si el pedido ya trae su propio token (withToken), se respeta
    if (config.headers.Authorization) return config

    const { token } = store.getState().auth
    if (!token) return config
    if (isTokenExpired(token)) {
      onSessionExpired() // borra el token del estado global: los pedidos siguientes ya no lo ven
      return config
    }
    config.headers.Authorization = `Bearer ${token}`
    return config
  })

  api.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(toApiError(error)),
  )
}

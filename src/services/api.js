/**
 * Conexión con el back (Spring Boot).
 * Todas las llamadas pasan por `request`, que hace el fetch, agrega el token
 * y transforma la respuesta a JSON. Devuelve siempre una promesa:
 *   - si sale bien  → .then(data => ...)   (valor de resolución)
 *   - si sale mal   → .catch(error => ...) (razón de rechazo, con error.message)
 */

// URL base del back. En desarrollo es localhost; al desplegar (Vercel) se define VITE_API_URL (ver .env.example).
const URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4002'
const TOKEN_KEY = 'etrip:token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const saveToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const removeToken = () => localStorage.removeItem(TOKEN_KEY)

/** true si el token ya venció. El JWT trae su vencimiento (`exp`, en segundos) en la parte del medio, en base64. */
export function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

// Qué hacer cuando la sesión vence en medio del uso. Lo define AuthProvider (cerrar sesión y pedir login).
let onSessionExpired = () => {}
export const setSessionExpiredHandler = (handler) => {
  onSessionExpired = handler
}

// `token` es opcional: por defecto se usa el de la sesión. El cargador de datos de prueba
// lo usa para hacer llamadas como otro usuario (sin cerrar la sesión del admin).
export function request(endpoint, method = 'GET', body, token = getToken()) {
  // Token vencido (dura 24 h): no lo mandamos y avisamos una sola vez que hay que volver a ingresar
  if (token && isTokenExpired(token)) {
    if (token === getToken()) {
      removeToken()
      onSessionExpired()
    }
    token = null
  }

  const options = { method, headers: {} }

  if (token) options.headers.Authorization = `Bearer ${token}`

  // Las fotos van como FormData; el resto, como JSON
  if (body instanceof FormData) {
    options.body = body
  } else if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }

  return fetch(`${URL}${endpoint}`, options).then((response) => {
    if (!response.ok) {
      // El back manda { message } cuando hay un error: lo usamos como mensaje
      return response
        .json()
        .catch(() => ({}))
        .then((data) => {
          const error = new Error(data.message || 'Ocurrió un error. Probá de nuevo.')
          error.status = response.status
          throw error
        })
    }
    // Algunas respuestas (DELETE) vienen sin cuerpo
    return response.text().then((text) => (text ? JSON.parse(text) : null))
  })
}

/** Los listados del back vienen paginados: { content: [...] }. Esto devuelve solo la lista. */
export function requestList(endpoint) {
  return request(endpoint).then((data) => (Array.isArray(data) ? data : data.content))
}

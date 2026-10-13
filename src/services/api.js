/**
 * Conexión con el back (Spring Boot).
 * Todas las llamadas pasan por `request`, que hace el fetch, agrega el token
 * y transforma la respuesta a JSON. Devuelve siempre una promesa:
 *   - si sale bien  → .then(data => ...)   (valor de resolución)
 *   - si sale mal   → .catch(error => ...) (razón de rechazo, con error.message)
 */

const URL = 'http://localhost:4002'
const TOKEN_KEY = 'etrip:token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const saveToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const removeToken = () => localStorage.removeItem(TOKEN_KEY)

// `token` es opcional: por defecto se usa el de la sesión. El cargador de datos de prueba
// lo usa para hacer llamadas como otro usuario (sin cerrar la sesión del admin).
export function request(endpoint, method = 'GET', body, token = getToken()) {
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

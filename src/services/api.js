const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4002'
const TOKEN_KEY = 'etrip:token'

export const getToken = () => window.localStorage.getItem(TOKEN_KEY)
export const setToken = (token) => window.localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => window.localStorage.removeItem(TOKEN_KEY)

export async function apiFetch(endpoint, options = {}) {
  const token = getToken()
  const headers = new Headers(options.headers)
  if (!(options.body instanceof FormData) && options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  const isPublicAuthEndpoint = endpoint.startsWith('/api/v1/auth/')
  if (token && !isPublicAuthEndpoint) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers })
  if (!response.ok) {
    let message = response.statusText || 'Ocurrió un error'
    try {
      const error = await response.json()
      message = error.message || message
    } catch {
      // Algunas respuestas de Spring no tienen cuerpo JSON.
    }
    console.error('[eTrip API]', {
      endpoint,
      method: options.method || 'GET',
      status: response.status,
      message,
    })
    const error = new Error(message)
    error.status = response.status
    throw error
  }
  if (response.status === 204) return null
  const text = await response.text()
  return text ? JSON.parse(text) : null
}

export const pageContent = (response) => (Array.isArray(response) ? response : response?.content ?? [])

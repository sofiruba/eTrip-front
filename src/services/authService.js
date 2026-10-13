import { request } from './api'

// POST /api/v1/auth/authenticate → { access_token }
export const login = (usernameOrEmail, password) =>
  request('/api/v1/auth/authenticate', 'POST', { usernameOrEmail, password })

// POST /api/v1/auth/register → { access_token }
export const register = ({ username, firstname, lastname, email, password }) =>
  request('/api/v1/auth/register', 'POST', { username, firstname, lastname, email, password })

// GET /api/v1/auth/availability → { usernameAvailable, emailAvailable } (null en lo que no se consultó)
export const checkAvailability = ({ username, email }) => {
  const params = new URLSearchParams()
  if (username) params.set('username', username)
  if (email) params.set('email', email)
  return request(`/api/v1/auth/availability?${params}`)
}

// POST /api/v1/auth/forgot-password → { devCode } (devCode solo en desarrollo). 404 si la cuenta no existe
export const forgotPassword = (usernameOrEmail) =>
  request('/api/v1/auth/forgot-password', 'POST', { usernameOrEmail })

// POST /api/v1/auth/verify-reset-code → 204 si el código es válido (el anterior queda anulado al pedir otro)
export const verifyResetCode = (usernameOrEmail, code) =>
  request('/api/v1/auth/verify-reset-code', 'POST', { usernameOrEmail, code })

// POST /api/v1/auth/reset-password → { access_token }
export const resetPassword = (usernameOrEmail, code, newPassword) =>
  request('/api/v1/auth/reset-password', 'POST', { usernameOrEmail, code, newPassword })

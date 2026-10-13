import { request } from './api'

// POST /api/v1/auth/authenticate → { access_token }
export const login = (usernameOrEmail, password) =>
  request('/api/v1/auth/authenticate', 'POST', { usernameOrEmail, password })

// POST /api/v1/auth/register → { access_token }
export const register = ({ username, firstname, lastname, email, password }) =>
  request('/api/v1/auth/register', 'POST', { username, firstname, lastname, email, password })

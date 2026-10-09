import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from '../hooks/useAuth'
import { useStore } from '../hooks/useStore'
import { apiFetch, clearToken, setToken } from '../services/api'

function AuthProvider({ children }) {
  const { reload } = useStore()
  const [user, setUser] = useState(null)
  const [authMode, setAuthMode] = useState(null)
  const [authRedirect, setAuthRedirect] = useState(null)

  const loadUser = useCallback(async () => {
    try {
      const current = await apiFetch('/users/me')
      setUser(current)
      await reload()
    } catch {
      clearToken()
      setUser(null)
    }
  }, [reload])

  useEffect(() => {
    if (window.localStorage.getItem('etrip:token')) loadUser()
  }, [loadUser])

  const login = useCallback(async (credentials) => {
    try {
      const response = await apiFetch('/api/v1/auth/authenticate', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })
      setToken(response.access_token)
      const current = await apiFetch('/users/me')
      setUser(current)
      await reload()
      setAuthMode(null)
      return { user: current }
    } catch (error) {
      return {
        error: [401, 403].includes(error.status)
          ? 'El email/usuario o la contraseña no son correctos.'
          : error.message,
      }
    }
  }, [reload])

  const register = useCallback(async ({ username, firstname, lastname, email, password }) => {
    try {
      const response = await apiFetch('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, firstname, lastname, email, password }),
      })
      setToken(response.access_token)
      const current = await apiFetch('/users/me')
      setUser(current)
      await reload()
      setAuthMode(null)
      return { user: current }
    } catch (error) {
      return { error: error.message }
    }
  }, [reload])

  const value = useMemo(
    () => ({
      user,
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      logout: () => {
        clearToken()
        setUser(null)
      },
      updateProfile: async (patch) => {
        const updated = await apiFetch('/users/me', { method: 'PUT', body: JSON.stringify(patch) })
        setUser(updated)
        return updated
      },
      authMode,
      authRedirect,
      openAuth: (mode = 'login', redirectTo = null) => {
        setAuthMode(mode)
        setAuthRedirect(redirectTo)
      },
      closeAuth: () => setAuthMode(null),
    }),
    [user, login, register, authMode, authRedirect],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider

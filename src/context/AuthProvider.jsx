import { useEffect, useState } from 'react'
import { AuthContext } from '../hooks/useAuth'
import { usePersistentState } from '../hooks/usePersistentState'
import { getToken, removeToken, saveToken } from '../services/api'
import * as authService from '../services/authService'
import { getMe, updateMe } from '../services/usersService'

/**
 * Sesión del usuario. El token se guarda en localStorage y se manda en cada llamada (ver services/api.js).
 * Bio, ciudad, intereses y foto no existen en el back: se guardan en este navegador, por usuario.
 */
function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // true mientras revisamos el token guardado (al recargar la página)
  const [checking, setChecking] = useState(Boolean(getToken()))
  const [extras, setExtras] = usePersistentState('plan:profileExtras', {})
  const [authMode, setAuthMode] = useState(null) // 'login' | 'register' | 'forgot' | null (modal cerrado)
  const [authRedirect, setAuthRedirect] = useState(null)

  // Al montar la app: si había un token guardado, traemos quién es el usuario
  useEffect(() => {
    if (!getToken()) return
    getMe()
      .then((data) => setUser(data))
      .catch(() => removeToken()) // token vencido o inválido
      .then(() => setChecking(false))
  }, [])

  // Guarda el token y trae los datos del usuario (lo usan login y registro)
  const startSession = (response) => {
    saveToken(response.access_token)
    return getMe().then((data) => {
      setUser(data)
      setAuthMode(null)
      return data
    })
  }

  const login = (usernameOrEmail, password) =>
    authService.login(usernameOrEmail, password).then(startSession)

  const register = (form, interests) =>
    authService.register(form).then(startSession).then((data) => {
      setExtras((current) => ({ ...current, [data.id]: { interests } }))
      return data
    })

  // Con el código de "Olvidé mi contraseña": cambia la contraseña y deja la sesión iniciada
  const resetPassword = (usernameOrEmail, code, newPassword) =>
    authService.resetPassword(usernameOrEmail, code, newPassword).then(startSession)

  const logout = () => {
    removeToken()
    setUser(null)
  }

  // Nombre y apellido van al back; el resto queda en el navegador
  const updateProfile = ({ firstName, lastName, ...extra }) => {
    if (Object.keys(extra).length) {
      setExtras((current) => ({ ...current, [user.id]: { ...current[user.id], ...extra } }))
    }
    if (firstName === undefined && lastName === undefined) return Promise.resolve(user)
    return updateMe({ firstName, lastName }).then((data) => setUser(data))
  }

  const value = {
    user: user ? { ...user, ...extras[user.id] } : null,
    isAdmin: user?.role === 'ADMIN',
    checking,
    login,
    register,
    resetPassword,
    logout,
    updateProfile,
    authMode,
    authRedirect,
    openAuth: (mode = 'login', redirectTo = null) => {
      setAuthMode(mode)
      setAuthRedirect(redirectTo)
    },
    closeAuth: () => setAuthMode(null),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider

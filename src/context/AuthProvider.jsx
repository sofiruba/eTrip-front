import { useMemo, useState } from 'react'
import { toLocalIso } from '../data/dates'
import { AuthContext } from '../hooks/useAuth'
import { usePersistentState } from '../hooks/usePersistentState'
import { useStore } from '../hooks/useStore'

function AuthProvider({ children }) {
  const { db, create, update } = useStore()
  const [userId, setUserId] = usePersistentState('plan:userId', null)
  const [authMode, setAuthMode] = useState(null)
  // A dónde ir después de ingresar (p. ej. el checkout desde el carrito)
  const [authRedirect, setAuthRedirect] = useState(null)

  const value = useMemo(() => {
    const user = db.users.find((entry) => entry.id === userId && entry.active) ?? null
    const same = (a = '', b = '') => a.toLowerCase() === b.trim().toLowerCase()
    const findByEmail = (email) => db.users.find((entry) => same(entry.email, email))
    const findByUsername = (username) => db.users.find((entry) => same(entry.username, username))

    // Igual que AuthenticationRequest del back: acepta email o nombre de usuario
    const login = ({ usernameOrEmail, password }) => {
      const account = findByEmail(usernameOrEmail) ?? findByUsername(usernameOrEmail)
      if (!account) return { error: 'No encontramos una cuenta con ese email o usuario.' }
      // Las cuentas semilla no tienen contraseña: en la demo cualquiera sirve
      if (account.password && account.password !== password) return { error: 'La contraseña no es correcta.' }
      if (!account.active) return { error: 'Esta cuenta está desactivada. Escribinos para reactivarla.' }
      setUserId(account.id)
      setAuthMode(null)
      return { user: account }
    }

    // Recibe los mismos campos que RegisterRequest del back
    const register = ({ username, firstname, lastname, email, password, interests }) => {
      if (findByEmail(email)) return { error: 'Ya existe una cuenta con ese email.' }
      if (findByUsername(username)) return { error: 'Ese nombre de usuario ya está en uso.' }
      const account = create('users', {
        username: username.trim(),
        firstName: firstname.trim(),
        lastName: lastname.trim(),
        email: email.trim(),
        // Solo en el mock: el back la guarda hasheada y nunca la devuelve
        password,
        role: 'CLIENTE',
        active: true,
        city: 'Buenos Aires',
        joinedAt: toLocalIso(new Date()),
        bio: '',
        interests,
      })
      setUserId(account.id)
      setAuthMode(null)
      return { user: account }
    }

    return {
      user,
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      logout: () => setUserId(null),
      updateProfile: (patch) => update('users', user.id, patch),
      authMode,
      authRedirect,
      openAuth: (mode = 'login', redirectTo = null) => {
        setAuthMode(mode)
        setAuthRedirect(redirectTo)
      },
      closeAuth: () => setAuthMode(null),
    }
  }, [db.users, userId, authMode, authRedirect, create, update, setUserId])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider

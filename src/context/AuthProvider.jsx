import { useMemo, useState } from 'react'
import { toLocalIso } from '../data/dates'
import { AuthContext } from '../hooks/useAuth'
import { usePersistentState } from '../hooks/usePersistentState'
import { useStore } from '../hooks/useStore'

function AuthProvider({ children }) {
  const { db, create, update } = useStore()
  const [userId, setUserId] = usePersistentState('plan:userId', null)
  const [authMode, setAuthMode] = useState(null)

  const value = useMemo(() => {
    const user = db.users.find((entry) => entry.id === userId && entry.active) ?? null
    const findByEmail = (email) => db.users.find((entry) => entry.email.toLowerCase() === email.trim().toLowerCase())

    const login = (email) => {
      const account = findByEmail(email)
      if (!account) return { error: 'No encontramos una cuenta con ese email.' }
      if (!account.active) return { error: 'Esta cuenta está desactivada. Escribinos para reactivarla.' }
      setUserId(account.id)
      setAuthMode(null)
      return { user: account }
    }

    const register = ({ firstName, lastName, email, interests }) => {
      if (findByEmail(email)) return { error: 'Ya existe una cuenta con ese email.' }
      const account = create('users', {
        username: email.split('@')[0],
        firstName,
        lastName,
        email,
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
      openAuth: (mode = 'login') => setAuthMode(mode),
      closeAuth: () => setAuthMode(null),
    }
  }, [db.users, userId, authMode, create, update, setUserId])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider

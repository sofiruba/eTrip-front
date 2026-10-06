import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

/** { user, isAdmin, login, register, logout, updateProfile, authMode, openAuth, closeAuth } */
export function useAuth() {
  return useContext(AuthContext)
}

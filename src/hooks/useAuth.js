import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

/** { user, isAdmin, checking, login, register, resetPassword, logout, updateProfile, authMode, openAuth, closeAuth } */
export function useAuth() {
  return useContext(AuthContext)
}

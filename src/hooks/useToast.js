import { createContext, useContext } from 'react'

export const ToastContext = createContext(null)

/** notify(mensaje, tono = 'success' | 'error' | 'info') */
export function useToast() {
  return useContext(ToastContext)
}

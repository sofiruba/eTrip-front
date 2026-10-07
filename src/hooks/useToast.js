import { createContext, useContext } from 'react'

export const ToastContext = createContext(null)

/** notify(mensaje, tono = 'success' | 'error' | 'info' | 'favorite' | 'unfavorite', acción opcional = { label, to }) */
export function useToast() {
  return useContext(ToastContext)
}

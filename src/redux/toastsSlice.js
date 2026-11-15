import { createSlice } from '@reduxjs/toolkit'

/**
 * Avisos que aparecen abajo de la pantalla ("Cambios guardados", errores del back…).
 * Cualquier componente los muestra con dispatch(showToast({ message, tone, link })):
 *   tone = 'success' (por defecto) | 'error' | 'info'   ·   link = { label, to } (opcional)
 * Los dibuja <Toaster /> (components/layout), que también los saca después de unos segundos.
 */

const MAX_TOASTS = 3

const toastsSlice = createSlice({
  name: 'toasts',
  initialState: {
    items: [],
    nextId: 1, // cada aviso tiene su id (lo usa <Toaster /> como key y para sacarlo)
  },
  reducers: {
    showToast: (state, action) => {
      const { message, tone = 'success', link = null } = action.payload
      const toast = { id: state.nextId, message, tone, link }
      state.nextId += 1
      // Me quedo con los últimos y agrego el nuevo al final
      state.items = [...state.items.slice(-(MAX_TOASTS - 1)), toast]
    },
    hideToast: (state, action) => {
      state.items = state.items.filter((toast) => toast.id !== action.payload)
    },
  },
})

export const { showToast, hideToast } = toastsSlice.actions

export default toastsSlice.reducer

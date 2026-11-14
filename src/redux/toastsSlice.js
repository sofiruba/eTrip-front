import { createSlice, nanoid } from '@reduxjs/toolkit'

/**
 * Avisos que aparecen abajo de la pantalla ("Cambios guardados", errores del back…).
 * Cualquier componente los muestra con dispatch(showToast('Mensaje', 'success' | 'error' | 'info', { label, to })).
 * Los dibuja <Toaster /> (components/layout), que también los saca después de unos segundos.
 */

const MAX_TOASTS = 3

const toastsSlice = createSlice({
  name: 'toasts',
  initialState: {
    items: [],
  },
  reducers: {
    showToast: {
      reducer: (state, action) => {
        state.items = [...state.items.slice(-(MAX_TOASTS - 1)), action.payload]
      },
      // `prepare` arma el payload: así se despacha con parámetros sueltos y cada aviso tiene su id
      prepare: (message, tone = 'success', link = null) => ({ payload: { id: nanoid(), message, tone, link } }),
    },
    hideToast: (state, action) => {
      state.items = state.items.filter((toast) => toast.id !== action.payload)
    },
  },
})

export const { showToast, hideToast } = toastsSlice.actions

export default toastsSlice.reducer

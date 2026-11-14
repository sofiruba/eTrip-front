import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, listOf } from './api'
import { sessionEnded } from './authSlice'
import { replaceById } from './helpers'

/** Avisos del usuario (compras de sus experiencias, cancelaciones, reembolsos). */

const URL = '/notifications'

// GET: al iniciar sesión y cada vez que se abre la campanita. Es la única lista que se vuelve a pedir a propósito:
// los avisos los generan OTROS usuarios en el back (alguien compró, el anfitrión canceló), así aparecen los nuevos
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async () => {
    const { data } = await api.get(URL)
    return listOf(data)
  },
  { condition: (_, { getState }) => Boolean(getState().auth.user) && !getState().notifications.loading },
)

// PATCH: marcar como leída → la notificación actualizada
export const markNotificationRead = createAsyncThunk('notifications/markNotificationRead', async (id) => {
  const { data } = await api.patch(`${URL}/${id}/read`)
  return data
})

const initialState = {
  items: [],
  loading: false,
  loaded: false,
  error: null,
}

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false
        state.loaded = true
        state.items = action.payload
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        replaceById(state.items, action.payload)
      })
      .addMatcher(sessionEnded, () => initialState)
  },
})

export default notificationsSlice.reducer

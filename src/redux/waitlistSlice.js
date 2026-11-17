import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api } from './api'
import { logout, sessionExpired } from './authSlice'

/**
 * Lista de espera: "Avisame si se libera un lugar" en las fechas agotadas. El back guarda quién espera en cada
 * fecha y, cuando se libera un lugar (un reembolso o el anfitrión amplía el cupo), manda la notificación
 * y saca a todos de la lista. Acá solo guardamos los ids de las fechas en las que estoy anotado.
 */

const ENDPOINT = '/experience-sessions'

// GET /experience-sessions/waitlist/mine → [sessionId, ...]
export const fetchWaitlist = createAsyncThunk('waitlist/fetchWaitlist', async () => {
  const { data } = await api.get(`${ENDPOINT}/waitlist/mine`)
  return data
})

// POST /experience-sessions/{id}/waitlist: el back valida que la fecha esté agotada, activa y sea futura
export const joinWaitlist = createAsyncThunk('waitlist/joinWaitlist', async (sessionId) => {
  await api.post(`${ENDPOINT}/${sessionId}/waitlist`)
  return sessionId
})

// DELETE /experience-sessions/{id}/waitlist
export const leaveWaitlist = createAsyncThunk('waitlist/leaveWaitlist', async (sessionId) => {
  await api.delete(`${ENDPOINT}/${sessionId}/waitlist`)
  return sessionId
})

const initialState = {
  sessionIds: [],
  loading: false,
  loaded: false,
  error: null,
}

const waitlistSlice = createSlice({
  name: 'waitlist',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWaitlist.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchWaitlist.fulfilled, (state, action) => {
        state.loading = false
        state.loaded = true
        state.sessionIds = action.payload
      })
      .addCase(fetchWaitlist.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      .addCase(joinWaitlist.fulfilled, (state, action) => {
        if (!state.sessionIds.includes(action.payload)) state.sessionIds.push(action.payload)
      })
      .addCase(leaveWaitlist.fulfilled, (state, action) => {
        state.sessionIds = state.sessionIds.filter((id) => id !== action.payload)
      })
      .addCase(logout, () => initialState)
      .addCase(sessionExpired, () => initialState)
  },
})

export default waitlistSlice.reducer

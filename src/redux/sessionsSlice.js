import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, listOf } from './api'
import { sessionEnded } from './authSlice'
import { refundBooking } from './bookingsSlice'
import { deleteExperience } from './experiencesSlice'
import { onlyOnce, removeById, replaceById } from './helpers'
import { cancelOrder, createOrder } from './ordersSlice'

/**
 * Fechas (sesiones) de las experiencias, con sus cupos (el "stock" del TPO).
 * Cuando se compra, se reembolsa o se cancela algo, los reducers de abajo ajustan los lugares que quedan
 * con lo que devolvió el back: no hace falta volver a pedir las fechas.
 */

const URL = '/experience-sessions'

// ---------- GET ----------

// Fechas públicas: el back manda las activas y futuras (también las agotadas). Una sola vez, al abrir la app
export const fetchSessions = createAsyncThunk(
  'sessions/fetchSessions',
  async () => {
    const { data } = await api.get(URL)
    return listOf(data)
  },
  onlyOnce((state) => state.sessions),
)

// Para gestionar: también las pasadas y las canceladas. Anfitrión → las de sus experiencias; admin → todas
export const fetchManagedSessions = createAsyncThunk(
  'sessions/fetchManagedSessions',
  async () => {
    const { data } = await api.get(`${URL}/manage`)
    return listOf(data)
  },
  onlyOnce((state) => state.sessions.managed),
)

// ---------- POST / PUT / DELETE ----------

// POST: session = { experienceId, startsAt, endsAt, capacity }
export const createSession = createAsyncThunk('sessions/createSession', async (session) => {
  const { data } = await api.post(URL, session)
  return data
})

// PUT: recibimos la sesión a actualizar y mandamos sus campos
export const updateSession = createAsyncThunk('sessions/updateSession', async ({ id, ...session }) => {
  const { data } = await api.put(`${URL}/${id}`, session)
  return data
})

// DELETE /experience-sessions/{id}: el back no la borra, la CANCELA (baja lógica) y reembolsa sus reservas.
// No devuelve nada: devolvemos la sesión para que los reducers sepan cuál cambió
export const cancelSession = createAsyncThunk('sessions/cancelSession', async (session) => {
  await api.delete(`${URL}/${session.id}`)
  return session
})

// DELETE /experience-sessions/{id}/permanent: borra del todo una fecha cancelada o terminada
export const removeSession = createAsyncThunk('sessions/removeSession', async (id) => {
  await api.delete(`${URL}/${id}/permanent`)
  return id
})

// ---------- Slice ----------

const initialState = {
  // Fechas públicas (catálogo, detalle, carrito)
  items: [],
  loading: false,
  loaded: false,
  error: null,
  // Modo anfitrión / panel de admin
  managed: { items: [], loading: false, loaded: false, error: null },
}

const isUpcoming = (session) => session.active && new Date(session.startsAt) > new Date()

// Suma (o resta, con números negativos) lugares libres a una fecha, en las dos listas
function changeSeats(state, sessionId, seats) {
  const copies = [...state.items, ...state.managed.items].filter((session) => session.id === sessionId)
  copies.forEach((session) => {
    session.availableSeats = Math.min(Math.max(session.availableSeats + seats, 0), session.capacity)
    if (session.status === 'SOLD_OUT' && session.availableSeats > 0) session.status = 'PUBLISHED'
    if (session.status === 'PUBLISHED' && session.availableSeats === 0) session.status = 'SOLD_OUT'
  })
}

const sessionsSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // GET públicas
      .addCase(fetchSessions.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.loading = false
        state.loaded = true
        state.items = action.payload
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })

      // GET para gestionar
      .addCase(fetchManagedSessions.pending, (state) => {
        state.managed.loading = true
        state.managed.error = null
      })
      .addCase(fetchManagedSessions.fulfilled, (state, action) => {
        state.managed.loading = false
        state.managed.loaded = true
        state.managed.items = action.payload
      })
      .addCase(fetchManagedSessions.rejected, (state, action) => {
        state.managed.loading = false
        state.managed.error = action.error.message
      })

      // POST: la fecha nueva va al calendario y, como es futura, también a las públicas
      .addCase(createSession.fulfilled, (state, action) => {
        state.managed.items.push(action.payload)
        if (isUpcoming(action.payload)) state.items.push(action.payload)
      })

      // PUT: findIndex + reemplazo en las dos listas
      .addCase(updateSession.fulfilled, (state, action) => {
        replaceById(state.managed.items, action.payload)
        replaceById(state.items, action.payload)
      })

      // Cancelada: queda en el historial del calendario (con sus lugares liberados) y sale de las públicas
      .addCase(cancelSession.fulfilled, (state, action) => {
        const { id, capacity } = action.payload
        const session = state.managed.items.find((entry) => entry.id === id)
        if (session) Object.assign(session, { active: false, editable: false, status: 'CANCELLED', availableSeats: capacity })
        removeById(state.items, id)
      })
      .addCase(removeSession.fulfilled, (state, action) => {
        removeById(state.managed.items, action.payload)
        removeById(state.items, action.payload)
      })

      // Compra: cada reserva de la orden descuenta sus lugares
      .addCase(createOrder.fulfilled, (state, action) => {
        action.payload.bookings.forEach((booking) => changeSeats(state, booking.experienceSessionId, -booking.quantity))
      })
      // Reembolso de una reserva o cancelación de una orden: los lugares vuelven a estar disponibles
      .addCase(refundBooking.fulfilled, (state, action) => {
        changeSeats(state, action.payload.experienceSessionId, action.payload.quantity)
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        action.payload.released.forEach((booking) => changeSeats(state, booking.experienceSessionId, booking.quantity))
      })

      // Se borró una experiencia: el back borra sus fechas
      .addCase(deleteExperience.fulfilled, (state, action) => {
        const { id } = action.payload
        state.items = state.items.filter((session) => session.experienceId !== id)
        state.managed.items = state.managed.items.filter((session) => session.experienceId !== id)
      })

      .addMatcher(sessionEnded, (state) => {
        state.managed = initialState.managed
      })
  },
})

export default sessionsSlice.reducer

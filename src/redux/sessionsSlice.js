import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, listOf } from './api'
import { logout, sessionExpired } from './authSlice'
import { refundBooking } from './bookingsSlice'
import { createExperience, deleteExperience, updateExperience, updateExperienceStatus } from './experiencesSlice'
import { removeById, replaceById } from './helpers'
import { cancelOrder, createOrder } from './ordersSlice'
import { joinWaitlist, leaveWaitlist } from './waitlistSlice'

/**
 * Fechas (sesiones) de las experiencias, con sus cupos (el "stock" del TPO).
 * Cuando se compra, se reembolsa o se cancela algo, los reducers de abajo ajustan los lugares que quedan
 * con lo que devolvió el back: no hace falta volver a pedir las fechas.
 */

const ENDPOINT = '/experience-sessions'

// ---------- GET ----------

// Fechas públicas: el back manda las activas y futuras (también las agotadas). Una sola vez, al abrir la app
export const fetchSessions = createAsyncThunk('sessions/fetchSessions', async () => {
  const { data } = await api.get(ENDPOINT)
  return listOf(data)
})

// Para gestionar: también las pasadas y las canceladas. Anfitrión → las de sus experiencias; admin → todas
export const fetchManagedSessions = createAsyncThunk('sessions/fetchManagedSessions', async () => {
  const { data } = await api.get(`${ENDPOINT}/manage`)
  return listOf(data)
})

// "Fechas y huéspedes" del anfitrión: un resumen por experiencia que calcula el back
// (fechas próximas, pasadas y canceladas, lugares reservados, ocupación y lista de espera)
export const fetchHostAgenda = createAsyncThunk('sessions/fetchHostAgenda', async () => {
  const { data } = await api.get(`${ENDPOINT}/manage/summary`)
  return data
})

// ---------- POST / PUT / DELETE ----------

// POST: session = { experienceId, startsAt, endsAt, capacity }
export const createSession = createAsyncThunk('sessions/createSession', async (session) => {
  const { data } = await api.post(ENDPOINT, session)
  return data
})

// PUT: recibimos la sesión a actualizar y mandamos sus campos
export const updateSession = createAsyncThunk('sessions/updateSession', async ({ id, ...session }) => {
  const { data } = await api.put(`${ENDPOINT}/${id}`, session)
  return data
})

// DELETE /experience-sessions/{id}: el back no la borra, la CANCELA (baja lógica) y reembolsa sus reservas.
// No devuelve nada: devolvemos la sesión para que los reducers sepan cuál cambió
export const cancelSession = createAsyncThunk('sessions/cancelSession', async (session) => {
  await api.delete(`${ENDPOINT}/${session.id}`)
  return session
})

// DELETE /experience-sessions/{id}/permanent: borra del todo una fecha cancelada o terminada
export const removeSession = createAsyncThunk('sessions/removeSession', async (id) => {
  await api.delete(`${ENDPOINT}/${id}/permanent`)
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
  // Resumen por experiencia del anfitrión (lo calcula el back)
  agenda: { items: [], loading: false, loaded: false, error: null },
}

// Cambió algo que el resumen del anfitrión cuenta: la próxima vez que se muestre se vuelve a pedir al back
function agendaOutdated(state) {
  state.agenda.loaded = false
}

const isUpcoming = (session) => session.active && new Date(session.startsAt) > new Date()

// Las copias de una fecha en las dos listas (catálogo y calendario)
const copiesOf = (state, sessionId) => [...state.items, ...state.managed.items].filter((session) => session.id === sessionId)

// Suma (o resta, con números negativos) lugares libres a una fecha, en las dos listas
function changeSeats(state, sessionId, seats) {
  copiesOf(state, sessionId).forEach((session) => {
    session.availableSeats = Math.min(Math.max(session.availableSeats + seats, 0), session.capacity)
  })
  // El estado de cada fecha (agotada, publicada) y su lista de espera los calcula el back: la lista del
  // calendario se vuelve a pedir la próxima vez que se muestre
  state.managed.loaded = false
}

// Alguien se anota (delta = 1) o se baja (delta = -1) de la lista de espera de una fecha
function changeWaitlist(state, sessionId, delta) {
  copiesOf(state, sessionId).forEach((session) => {
    session.waitlistCount = Math.max((session.waitlistCount ?? 0) + delta, 0)
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

      // GET resumen del anfitrión
      .addCase(fetchHostAgenda.pending, (state) => {
        state.agenda.loading = true
        state.agenda.error = null
      })
      .addCase(fetchHostAgenda.fulfilled, (state, action) => {
        state.agenda.loading = false
        state.agenda.loaded = true
        state.agenda.items = action.payload
      })
      .addCase(fetchHostAgenda.rejected, (state, action) => {
        state.agenda.loading = false
        state.agenda.error = action.error.message
      })

      // POST: la fecha nueva va al calendario y, como es futura, también a las públicas
      .addCase(createSession.fulfilled, (state, action) => {
        state.managed.items.push(action.payload)
        if (isUpcoming(action.payload)) state.items.push(action.payload)
        agendaOutdated(state)
      })

      // PUT: findIndex + reemplazo en las dos listas
      .addCase(updateSession.fulfilled, (state, action) => {
        replaceById(state.managed.items, action.payload)
        replaceById(state.items, action.payload)
        agendaOutdated(state)
      })

      // Cancelada: queda en el historial del calendario (con sus lugares liberados) y sale de las públicas
      .addCase(cancelSession.fulfilled, (state, action) => {
        const { id, capacity } = action.payload
        const session = state.managed.items.find((entry) => entry.id === id)
        if (session) Object.assign(session, { active: false, editable: false, status: 'CANCELLED', availableSeats: capacity })
        removeById(state.items, id)
        agendaOutdated(state)
      })
      .addCase(removeSession.fulfilled, (state, action) => {
        removeById(state.managed.items, action.payload)
        removeById(state.items, action.payload)
        agendaOutdated(state)
      })

      // Compra: cada reserva de la orden descuenta sus lugares
      .addCase(createOrder.fulfilled, (state, action) => {
        action.payload.bookings.forEach((booking) => changeSeats(state, booking.experienceSessionId, -booking.quantity))
        agendaOutdated(state)
      })
      // Reembolso de una reserva o cancelación de una orden: los lugares vuelven a estar disponibles
      .addCase(refundBooking.fulfilled, (state, action) => {
        changeSeats(state, action.payload.experienceSessionId, action.payload.quantity)
        agendaOutdated(state)
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        action.payload.released.forEach((booking) => changeSeats(state, booking.experienceSessionId, booking.quantity))
        agendaOutdated(state)
      })

      // Lista de espera: el contador de cada fecha ("3 en lista de espera" en el calendario)
      .addCase(joinWaitlist.fulfilled, (state, action) => changeWaitlist(state, action.payload, 1))
      .addCase(leaveWaitlist.fulfilled, (state, action) => changeWaitlist(state, action.payload, -1))

      // Se dio de baja una experiencia: el back cancela (o borra) sus fechas
      .addCase(deleteExperience.fulfilled, (state, action) => {
        const { id } = action.payload
        state.items = state.items.filter((session) => session.experienceId !== id)
        state.managed.items = state.managed.items.filter((session) => session.experienceId !== id)
        agendaOutdated(state)
      })
      // Experiencia nueva, renombrada o pausada: también cambia el resumen
      .addCase(createExperience.fulfilled, agendaOutdated)
      .addCase(updateExperience.fulfilled, agendaOutdated)
      .addCase(updateExperienceStatus.fulfilled, agendaOutdated)

      // Al cerrar sesión, el calendario de esa cuenta vuelve al estado inicial
      .addCase(logout, (state) => {
        state.managed = initialState.managed
        state.agenda = initialState.agenda
      })
      .addCase(sessionExpired, (state) => {
        state.managed = initialState.managed
        state.agenda = initialState.agenda
      })
  },
})

export default sessionsSlice.reducer

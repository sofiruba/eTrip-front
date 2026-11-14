import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, listOf } from './api'
import { sessionEnded } from './authSlice'
import { deleteExperience } from './experiencesSlice'
import { onlyOnce, replaceById } from './helpers'
import { cancelOrder, createOrder } from './ordersSlice'
import { cancelSession, removeSession } from './sessionsSlice'

/** Reservas (vouchers). Cada compra genera una reserva por fecha. */

const URL = '/bookings'

// ---------- GET ----------

// Cliente: sus reservas. Administrador: todas. Una vez por sesión
export const fetchBookings = createAsyncThunk(
  'bookings/fetchBookings',
  async () => {
    const { data } = await api.get(URL)
    return listOf(data)
  },
  onlyOnce((state) => state.bookings),
)

// Anfitrión: las reservas de sus experiencias (sus ventas)
export const fetchSales = createAsyncThunk(
  'bookings/fetchSales',
  async () => {
    const { data } = await api.get(`${URL}/sales`)
    return listOf(data)
  },
  onlyOnce((state) => state.bookings.sales),
)

// Una reserva (detalle). Si ya tenemos la lista de mis reservas no hace falta pedirla
export const fetchBookingById = createAsyncThunk(
  'bookings/fetchBookingById',
  async (id) => {
    const { data } = await api.get(`${URL}/${id}`)
    return data
  },
  {
    condition: (id, { getState }) => {
      const { items, details } = getState().bookings
      const known = items.some((booking) => booking.id === Number(id))
      return !known && (!details[id] || Boolean(details[id].error))
    },
  },
)

// ---------- POST ----------

// POST /bookings/{id}/refund → la reserva actualizada (refunded: true). El back controla la política de 48 h
export const refundBooking = createAsyncThunk('bookings/refundBooking', async (id) => {
  const { data } = await api.post(`${URL}/${id}/refund`)
  return data
})

// ---------- Slice ----------

const initialState = {
  items: [], // mis reservas (o todas, si es admin)
  loading: false,
  loaded: false,
  error: null,
  sales: { items: [], loading: false, loaded: false, error: null }, // modo anfitrión
  details: {}, // { [id]: { item, loading, error, notFound } }: reservas abiertas por link sin tener la lista
}

// Todas las copias de reservas que tenemos guardadas
const allBookings = (state) => [
  ...state.items,
  ...state.sales.items,
  ...Object.values(state.details)
    .map((detail) => detail.item)
    .filter(Boolean),
]

function replaceEverywhere(state, updated) {
  replaceById(state.items, updated)
  replaceById(state.sales.items, updated)
  if (state.details[updated.id]) state.details[updated.id].item = updated
}

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false
        state.loaded = true
        state.items = action.payload
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })

      .addCase(fetchSales.pending, (state) => {
        state.sales.loading = true
        state.sales.error = null
      })
      .addCase(fetchSales.fulfilled, (state, action) => {
        state.sales.loading = false
        state.sales.loaded = true
        state.sales.items = action.payload
      })
      .addCase(fetchSales.rejected, (state, action) => {
        state.sales.loading = false
        state.sales.error = action.error.message
      })

      .addCase(fetchBookingById.pending, (state, action) => {
        state.details[action.meta.arg] = { item: null, loading: true, error: null, notFound: false }
      })
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.details[action.meta.arg] = { item: action.payload, loading: false, error: null, notFound: false }
      })
      .addCase(fetchBookingById.rejected, (state, action) => {
        // 403 / 404: no existe o no es tuya
        const notFound = ['403', '404'].includes(action.error.code)
        state.details[action.meta.arg] = { item: null, loading: false, error: action.error.message, notFound }
      })

      // Reembolso: reemplazamos la reserva por la que devolvió el back
      .addCase(refundBooking.fulfilled, (state, action) => replaceEverywhere(state, action.payload))

      // Compra: las reservas nuevas se suman a "Mis reservas" (si ya las habíamos traído)
      .addCase(createOrder.fulfilled, (state, action) => {
        if (state.loaded) state.items = [...state.items, ...action.payload.bookings]
      })
      // El admin canceló una orden: sus reservas vienen actualizadas adentro de la orden
      .addCase(cancelOrder.fulfilled, (state, action) => {
        action.payload.order.bookings.forEach((booking) => replaceEverywhere(state, booking))
      })
      // Fecha cancelada: el back reembolsa todas sus reservas
      .addCase(cancelSession.fulfilled, (state, action) => {
        allBookings(state)
          .filter((booking) => booking.experienceSessionId === action.payload.id && !booking.refunded)
          .forEach((booking) => Object.assign(booking, { refunded: true, status: 'REFUNDED' }))
      })
      // Fecha borrada del todo: el back borra sus reservas
      .addCase(removeSession.fulfilled, (state, action) => {
        const fromOtherSession = (booking) => booking.experienceSessionId !== action.payload
        state.items = state.items.filter(fromOtherSession)
        state.sales.items = state.sales.items.filter(fromOtherSession)
      })
      // Experiencia borrada: el back borra sus reservas (solo puede tener pasadas)
      .addCase(deleteExperience.fulfilled, (state, action) => {
        const fromOtherExperience = (booking) => booking.experienceId !== action.payload.id
        state.items = state.items.filter(fromOtherExperience)
        state.sales.items = state.sales.items.filter(fromOtherExperience)
      })

      .addMatcher(sessionEnded, () => initialState)
  },
})

/** Una reserva por id, desde la lista o desde el detalle que se pidió aparte. */
export const selectBookingById = (state, id) =>
  state.bookings.items.find((booking) => booking.id === Number(id)) ?? state.bookings.details[id]?.item ?? null

export default bookingsSlice.reducer

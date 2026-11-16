import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, listOf } from './api'
import { logout, sessionExpired } from './authSlice'
import { deleteExperience } from './experiencesSlice'
import { replaceById } from './helpers'
import { cancelGift, cancelOrder, createOrder, updateGiftEmail } from './ordersSlice'
import { cancelSession, removeSession } from './sessionsSlice'

/** Reservas (vouchers). Cada compra genera una reserva por fecha. */

const URL = '/bookings'

// ---------- GET ----------

// Cliente: sus reservas. Administrador: todas. Una vez por sesión
export const fetchBookings = createAsyncThunk('bookings/fetchBookings', async () => {
  const { data } = await api.get(URL)
  return listOf(data)
})

// Anfitrión: las reservas de sus experiencias (sus ventas)
export const fetchSales = createAsyncThunk('bookings/fetchSales', async () => {
  const { data } = await api.get(`${URL}/sales`)
  return listOf(data)
})

// Una reserva (detalle). La página solo la pide si no estaba ya en "Mis reservas"
export const fetchBookingById = createAsyncThunk('bookings/fetchBookingById', async (id) => {
  const { data } = await api.get(`${URL}/${id}`)
  return data
})

// ---------- POST ----------

// POST /bookings/{id}/refund → la reserva actualizada (refunded: true). El back controla la política de 48 h
// GET /bookings/{id}/voucher → el voucher como imagen (PNG). Lo arma el back y solo se lo da a quien lo tiene.
// En el celu se abre el menú de compartir del sistema (WhatsApp, mail…) con el archivo; si el navegador no puede
// compartir archivos (en la compu, por ejemplo), se descarga. No se guarda nada en el estado: es solo el archivo
export const shareVoucher = createAsyncThunk('bookings/shareVoucher', async (booking) => {
  const { data } = await api.get(`/bookings/${booking.id}/voucher`, { responseType: 'blob' })
  const file = new File([data], `voucher-${booking.voucherCode}.png`, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    // Si la persona cierra el menú sin compartir, no es un error
    return navigator
      .share({ files: [file], title: `Voucher · ${booking.experienceTitle}` })
      .then(() => 'shared')
      .catch(() => 'cancelled')
  }
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  return 'downloaded'
})

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
      // Regalo pendiente corregido o cancelado: las reservas vienen actualizadas adentro de la orden
      .addCase(updateGiftEmail.fulfilled, (state, action) => {
        action.payload.bookings.forEach((booking) => replaceEverywhere(state, booking))
      })
      .addCase(cancelGift.fulfilled, (state, action) => {
        action.payload.bookings.forEach((booking) => replaceEverywhere(state, booking))
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
      // Experiencia dada de baja: el back reembolsó todas las reservas de sus fechas futuras (las pasadas quedan)
      .addCase(deleteExperience.fulfilled, (state, action) => {
        allBookings(state)
          .filter((booking) => booking.experienceId === action.payload.id && !booking.refunded && new Date(booking.startsAt) > new Date())
          .forEach((booking) => Object.assign(booking, { refunded: true, status: 'REFUNDED' }))
      })

      // Al cerrar sesión vuelve al estado inicial
      .addCase(logout, () => initialState)
      .addCase(sessionExpired, () => initialState)
  },
})

export default bookingsSlice.reducer

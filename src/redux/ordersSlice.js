import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, listOf } from './api'
import { logout, sessionExpired } from './authSlice'
import { refundBooking } from './bookingsSlice'
import { deleteExperience } from './experiencesSlice'
import { replaceById } from './helpers'
import { cancelSession } from './sessionsSlice'

/** Órdenes: cada checkout genera una orden que agrupa sus reservas. */

const ENDPOINT = '/orders'

// ---------- GET ----------

// Cliente: sus órdenes. Administrador: todas
export const fetchOrders = createAsyncThunk('orders/fetchOrders', async () => {
  const { data } = await api.get(ENDPOINT)
  return listOf(data)
})

// Administrador: ventas netas y comisión → { orderCount, grossSales, refunded, netSales, commission, commissionRate }
export const fetchOrderStats = createAsyncThunk('orders/fetchOrderStats', async () => {
  const { data } = await api.get(`${ENDPOINT}/stats`)
  return data
})

// Una orden. Recién comprada ya está en el store (createOrder la guarda): la página solo la pide si se recargó
export const fetchOrderById = createAsyncThunk('orders/fetchOrderById', async (id) => {
  const { data } = await api.get(`${ENDPOINT}/${id}`)
  return data
})

// ---------- POST ----------

// POST /orders: paga (simulado) y compra todo el carrito.
// payment = { couponCode, paymentMethod, cardNumber, expectedTotal, gift: { recipientName, recipientEmail, message } | null }
// El back valida el stock de cada fecha, lo descuenta, crea las reservas y vacía el carrito
export const createOrder = createAsyncThunk('orders/createOrder', async (payment) => {
  const { data } = await api.post(ENDPOINT, payment)
  return data
})

// POST /orders/{id}/cancel (admin): reembolsa las reservas que todavía no empezaron.
// Recibe la orden como estaba antes, para saber qué reservas se reembolsaron recién (sus lugares vuelven a estar libres)
export const cancelOrder = createAsyncThunk('orders/cancelOrder', async (order) => {
  const { data } = await api.post(`${ENDPOINT}/${order.id}/cancel`)
  const wasRefunded = (bookingId) => order.bookings.some((booking) => booking.id === bookingId && booking.refunded)
  const released = data.bookings.filter((booking) => booking.refunded && !wasRefunded(booking.id))
  return { order: data, released }
})

// Regalo pendiente (todavía no es de quien lo recibe: no tiene cuenta verificada con ese email).
// PATCH /orders/{id}/gift: quien pagó corrige el email; el back vuelve a mandar la invitación y, si el email nuevo
// es de una cuenta verificada, se lo entrega en el momento. Devuelve la orden actualizada
export const updateGiftEmail = createAsyncThunk('orders/updateGiftEmail', async ({ orderId, recipientEmail }) => {
  const { data } = await api.patch(`${ENDPOINT}/${orderId}/gift`, { recipientEmail })
  return data
})

// DELETE /orders/{id}/gift: quien pagó se queda el regalo (pasa a ser una compra común). Devuelve la orden actualizada
export const cancelGift = createAsyncThunk('orders/cancelGift', async (orderId) => {
  const { data } = await api.delete(`${ENDPOINT}/${orderId}/gift`)
  return data
})

// ---------- Slice ----------

const initialState = {
  items: [],
  loading: false,
  loaded: false,
  error: null,
  stats: { data: null, loading: false, loaded: false, error: null },
  details: {}, // { [id]: { item, loading, error, notFound } }
}

// Se reembolsaron reservas: lo devuelto, la comisión y el estado de sus órdenes los calcula el back.
// Se descartan las órdenes guardadas y la pantalla que las muestre las vuelve a pedir
function ordersChanged(state) {
  state.items = []
  state.loaded = false
  state.details = {}
  state.stats.loaded = false
}

// Reemplaza una orden en la lista y en su detalle
function replaceOrder(state, order) {
  replaceById(state.items, order)
  if (state.details[order.id]) state.details[order.id].item = order
}

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false
        state.loaded = true
        state.items = action.payload
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })

      .addCase(fetchOrderStats.pending, (state) => {
        state.stats.loading = true
        state.stats.error = null
      })
      .addCase(fetchOrderStats.fulfilled, (state, action) => {
        state.stats.loading = false
        state.stats.loaded = true
        state.stats.data = action.payload
      })
      .addCase(fetchOrderStats.rejected, (state, action) => {
        state.stats.loading = false
        state.stats.error = action.error.message
      })

      .addCase(fetchOrderById.pending, (state, action) => {
        state.details[action.meta.arg] = { item: null, loading: true, error: null, notFound: false }
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.details[action.meta.arg] = { item: action.payload, loading: false, error: null, notFound: false }
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        const notFound = ['403', '404'].includes(action.error.code)
        state.details[action.meta.arg] = { item: null, loading: false, error: action.error.message, notFound }
      })

      // POST: la orden nueva queda guardada (la pantalla de confirmación la lee de acá, sin otro GET)
      .addCase(createOrder.fulfilled, (state, action) => {
        const order = action.payload
        if (state.loaded) state.items.push(order)
        state.details[order.id] = { item: order, loading: false, error: null, notFound: false }
      })
      // El back devuelve la orden cancelada completa: la reemplazamos
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const { order } = action.payload
        replaceById(state.items, order)
        if (state.details[order.id]) state.details[order.id].item = order
        state.stats.loaded = false // las ventas netas cambiaron: el resumen las vuelve a pedir
      })
      // Regalo: el back devuelve la orden con el email nuevo o ya sin regalo
      .addCase(updateGiftEmail.fulfilled, (state, action) => replaceOrder(state, action.payload))
      .addCase(cancelGift.fulfilled, (state, action) => replaceOrder(state, action.payload))
      // Reembolsos (de una reserva, de una fecha cancelada o de una experiencia dada de baja)
      .addCase(refundBooking.fulfilled, ordersChanged)
      .addCase(cancelSession.fulfilled, ordersChanged)
      .addCase(deleteExperience.fulfilled, ordersChanged)

      // Al cerrar sesión vuelve al estado inicial
      .addCase(logout, () => initialState)
      .addCase(sessionExpired, () => initialState)
  },
})

export default ordersSlice.reducer

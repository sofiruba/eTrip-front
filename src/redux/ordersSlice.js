import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, listOf } from './api'
import { logout, sessionExpired } from './authSlice'
import { refundBooking } from './bookingsSlice'
import { replaceById } from './helpers'
import { cancelSession } from './sessionsSlice'

/** Órdenes: cada checkout genera una orden que agrupa sus reservas. */

const URL = '/orders'

// Igual que PLAN_COMMISSION_RATE del back: la comisión de PLAN sobre lo cobrado neto
const COMMISSION_RATE = 0.1

// ---------- GET ----------

// Cliente: sus órdenes. Administrador: todas
export const fetchOrders = createAsyncThunk('orders/fetchOrders', async () => {
  const { data } = await api.get(URL)
  return listOf(data)
})

// Administrador: ventas netas y comisión → { orderCount, grossSales, refunded, netSales, commission, commissionRate }
export const fetchOrderStats = createAsyncThunk('orders/fetchOrderStats', async () => {
  const { data } = await api.get(`${URL}/stats`)
  return data
})

// Una orden. Recién comprada ya está en el store (createOrder la guarda): la página solo la pide si se recargó
export const fetchOrderById = createAsyncThunk('orders/fetchOrderById', async (id) => {
  const { data } = await api.get(`${URL}/${id}`)
  return data
})

// ---------- POST ----------

// POST /orders: paga (simulado) y compra todo el carrito. payment = { couponCode, paymentMethod, cardNumber, expectedTotal }
// El back valida el stock de cada fecha, lo descuenta, crea las reservas y vacía el carrito
export const createOrder = createAsyncThunk('orders/createOrder', async (payment) => {
  const { data } = await api.post(URL, payment)
  return data
})

// POST /orders/{id}/cancel (admin): reembolsa las reservas que todavía no empezaron.
// Recibe la orden como estaba antes, para saber qué reservas se reembolsaron recién (sus lugares vuelven a estar libres)
export const cancelOrder = createAsyncThunk('orders/cancelOrder', async (order) => {
  const { data } = await api.post(`${URL}/${order.id}/cancel`)
  const wasRefunded = (bookingId) => order.bookings.some((booking) => booking.id === bookingId && booking.refunded)
  const released = data.bookings.filter((booking) => booking.refunded && !wasRefunded(booking.id))
  return { order: data, released }
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

const allOrders = (state) => [
  ...state.items,
  ...Object.values(state.details)
    .map((detail) => detail.item)
    .filter(Boolean),
]

/**
 * Una reserva de la orden se reembolsó: la reemplazamos y recalculamos lo mismo que calcula el back
 * (monto reembolsado, comisión sobre lo neto y estado: PAID / PARTIALLY_REFUNDED / CANCELLED).
 */
function refundInOrder(order, refunded) {
  const index = order.bookings.findIndex((booking) => booking.id === refunded.id)
  if (index === -1 || order.bookings[index].refunded) return
  const previous = order.bookings[index]
  order.bookings[index] = refunded
  order.refunded = Number(order.refunded ?? 0) + Number(previous.paidAmount ?? 0)
  order.commission = Math.round((Number(order.total) - order.refunded) * COMMISSION_RATE * 100) / 100
  const refundedCount = order.bookings.filter((booking) => booking.refunded).length
  order.status = refundedCount === order.bookings.length ? 'CANCELLED' : 'PARTIALLY_REFUNDED'
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
      // Reembolso de una reserva: actualizamos la orden que la contiene
      .addCase(refundBooking.fulfilled, (state, action) => {
        allOrders(state).forEach((order) => refundInOrder(order, action.payload))
        state.stats.loaded = false
      })
      // Fecha cancelada: el back reembolsa todas sus reservas
      .addCase(cancelSession.fulfilled, (state, action) => {
        allOrders(state).forEach((order) =>
          order.bookings
            .filter((booking) => booking.experienceSessionId === action.payload.id && !booking.refunded)
            .forEach((booking) => refundInOrder(order, { ...booking, refunded: true, status: 'REFUNDED', paidAmount: 0 })),
        )
        state.stats.loaded = false
      })

      // Al cerrar sesión vuelve al estado inicial
      .addCase(logout, () => initialState)
      .addCase(sessionExpired, () => initialState)
  },
})

export default ordersSlice.reducer

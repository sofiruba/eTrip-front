import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api } from './api'
import { logout, sessionExpired } from './authSlice'
import { createOrder } from './ordersSlice'

/**
 * Carrito del usuario. Vive en el back (así se valida el stock al pagar) y acá tenemos la copia que se muestra:
 * el navbar (cantidad), el detalle (lo que ya agregaste), el carrito y el checkout leen este slice.
 */

const ENDPOINT = '/carts'

// GET: el carrito del usuario que inició sesión (App.jsx lo pide al iniciar sesión; al cerrarla se vacía este slice)
export const fetchCart = createAsyncThunk('cart/fetchCart', async (userId) => {
  const { data } = await api.get(`${ENDPOINT}/user/${userId}`)
  return data
})

// POST: lugares de una fecha → el back devuelve el carrito completo
export const addToCart = createAsyncThunk('cart/addToCart', async ({ sessionId, quantity }) => {
  const { data } = await api.post(`${ENDPOINT}/items`, { experienceSessionId: sessionId, quantity })
  return data
})

// PATCH: solo la cantidad de un ítem → el back devuelve el carrito completo
export const updateCartItem = createAsyncThunk('cart/updateCartItem', async ({ userId, itemId, quantity }) => {
  const { data } = await api.patch(`${ENDPOINT}/user/${userId}/items/${itemId}`, null, { params: { quantity } })
  return data
})

// DELETE: el back no devuelve el carrito, así que devolvemos el id y el reducer recalcula el total
export const removeCartItem = createAsyncThunk('cart/removeCartItem', async ({ userId, itemId }) => {
  await api.delete(`${ENDPOINT}/user/${userId}/items/${itemId}`)
  return itemId
})

const initialState = {
  items: [], // [{ id, experienceSessionId, experienceId, experienceTitle, startsAt, quantity, unitPrice, subtotal }]
  total: 0,
  loading: false,
  loaded: false,
  error: null,
}

// El back siempre devuelve el carrito entero: lo guardamos tal cual
function saveCart(state, cart) {
  state.items = cart.items ?? []
  state.total = Number(cart.total ?? 0)
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false
        state.loaded = true
        saveCart(state, action.payload)
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      .addCase(addToCart.fulfilled, (state, action) => saveCart(state, action.payload))
      .addCase(updateCartItem.fulfilled, (state, action) => saveCart(state, action.payload))
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload)
        state.total = state.items.reduce((sum, item) => sum + Number(item.subtotal), 0)
      })
      // Al pagar, el back compra todo lo que había y vacía el carrito
      .addCase(createOrder.fulfilled, (state) => {
        state.items = []
        state.total = 0
      })
      // Al cerrar sesión el carrito vuelve al estado inicial
      .addCase(logout, () => initialState)
      .addCase(sessionExpired, () => initialState)
  },
})

export default cartSlice.reducer

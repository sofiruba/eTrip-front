import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api } from './api'
import { sessionEnded } from './authSlice'
import { createOrder } from './ordersSlice'

/**
 * Carrito del usuario. Vive en el back (así se valida el stock al pagar) y acá tenemos la copia que se muestra:
 * el navbar (cantidad), el detalle (lo que ya agregaste), el carrito y el checkout leen este slice.
 */

const URL = '/carts'
const userIdOf = (getState) => getState().auth.user.id

// GET: el carrito del usuario que inició sesión. Una vez por sesión (al cerrar sesión se vacía este slice)
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { getState }) => {
    const { data } = await api.get(`${URL}/user/${userIdOf(getState)}`)
    return data
  },
  {
    condition: (arg, { getState }) => {
      const { auth, cart } = getState()
      // Sin sesión no hay carrito, y los administradores no compran
      if (!auth.user || auth.user.role === 'ADMIN') return false
      return Boolean(arg?.force) || (!cart.loaded && !cart.loading)
    },
  },
)

// POST: lugares de una fecha → el back devuelve el carrito completo
export const addToCart = createAsyncThunk('cart/addToCart', async ({ sessionId, quantity }) => {
  const { data } = await api.post(`${URL}/items`, { experienceSessionId: sessionId, quantity })
  return data
})

// PATCH: solo la cantidad de un ítem → el back devuelve el carrito completo
export const updateCartItem = createAsyncThunk('cart/updateCartItem', async ({ itemId, quantity }, { getState }) => {
  const { data } = await api.patch(`${URL}/user/${userIdOf(getState)}/items/${itemId}`, null, { params: { quantity } })
  return data
})

// DELETE: el back no devuelve el carrito, así que devolvemos el id y el reducer recalcula el total
export const removeCartItem = createAsyncThunk('cart/removeCartItem', async (itemId, { getState }) => {
  await api.delete(`${URL}/user/${userIdOf(getState)}/items/${itemId}`)
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
      .addMatcher(sessionEnded, () => initialState)
  },
})

// ---------- Selectores ----------

/** Cantidad de lugares en el carrito (el número del navbar). */
export const selectCartCount = (state) => state.cart.items.reduce((sum, item) => sum + item.quantity, 0)

/** Lugares de una fecha que ya están en el carrito. */
export const selectQuantityInCart = (state, sessionId) =>
  state.cart.items.find((item) => item.experienceSessionId === sessionId)?.quantity ?? 0

export default cartSlice.reducer

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, listOf } from './api'
import { logout, sessionExpired } from './authSlice'
import { removeById, replaceById } from './helpers'

/** Cupones de descuento: el admin los gestiona y el checkout los valida. */

const URL = '/discount-coupons'

// GET (admin)
export const fetchCoupons = createAsyncThunk('coupons/fetchCoupons', async () => {
  const { data } = await api.get(URL)
  return listOf(data)
})

// GET /discount-coupons/validate?code= → { code, valid, reason, message, percentage, subtotal, discountAmount, total }
// El back calcula el descuento con el carrito actual. El checkout guarda el resultado en su estado local
export const validateCoupon = createAsyncThunk('coupons/validateCoupon', async (code) => {
  const { data } = await api.get(`${URL}/validate`, { params: { code } })
  return data
})

// POST: newCoupon = { code, percentage, validFrom, validUntil, active }
export const createCoupon = createAsyncThunk('coupons/createCoupon', async (newCoupon) => {
  const { data } = await api.post(URL, newCoupon)
  return data
})

// PUT: el cupón completo
export const updateCoupon = createAsyncThunk('coupons/updateCoupon', async ({ id, ...coupon }) => {
  const { data } = await api.put(`${URL}/${id}`, coupon)
  return data
})

// DELETE: si el cupón ya se usó en alguna orden, el back no lo borra: lo desactiva (para no romper órdenes viejas).
// `used` = cuántas órdenes lo usaron (el panel lo sabe porque tiene las órdenes en el store): el reducer aplica la misma regla
export const deleteCoupon = createAsyncThunk('coupons/deleteCoupon', async ({ id, used }) => {
  await api.delete(`${URL}/${id}`)
  return { id, used }
})

const initialState = {
  items: [],
  loading: false,
  loaded: false,
  error: null,
}

const couponsSlice = createSlice({
  name: 'coupons',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoupons.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.loading = false
        state.loaded = true
        state.items = action.payload
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      .addCase(createCoupon.fulfilled, (state, action) => {
        state.items = [...state.items, action.payload]
      })
      .addCase(updateCoupon.fulfilled, (state, action) => {
        replaceById(state.items, action.payload)
      })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        const { id, used } = action.payload
        const coupon = state.items.find((item) => item.id === id)
        if (used > 0 && coupon) coupon.active = false // baja lógica, igual que en el back
        else removeById(state.items, id)
      })
      // Al cerrar sesión vuelve al estado inicial (la lista es del admin)
      .addCase(logout, () => initialState)
      .addCase(sessionExpired, () => initialState)
  },
})

export default couponsSlice.reducer

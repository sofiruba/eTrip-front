import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, listOf } from './api'
import { logout, sessionExpired } from './authSlice'
import { removeById, replaceById } from './helpers'

/** Cupones de descuento: el admin los gestiona y el checkout los valida. */

const ENDPOINT = '/discount-coupons'

// GET (admin)
export const fetchCoupons = createAsyncThunk('coupons/fetchCoupons', async () => {
  const { data } = await api.get(ENDPOINT)
  return listOf(data)
})

// GET /discount-coupons/validate?code= → { code, valid, reason, message, percentage, subtotal, discountAmount, total }
// El back calcula el descuento con el carrito actual. El checkout guarda el resultado en su estado local
export const validateCoupon = createAsyncThunk('coupons/validateCoupon', async (code) => {
  const { data } = await api.get(`${ENDPOINT}/validate`, { params: { code } })
  return data
})

// POST: newCoupon = { code, percentage, validFrom, validUntil, active }
export const createCoupon = createAsyncThunk('coupons/createCoupon', async (newCoupon) => {
  const { data } = await api.post(ENDPOINT, newCoupon)
  return data
})

// PUT: el cupón completo
export const updateCoupon = createAsyncThunk('coupons/updateCoupon', async ({ id, ...coupon }) => {
  const { data } = await api.put(`${ENDPOINT}/${id}`, coupon)
  return data
})

// DELETE: si el cupón nunca se usó, el back lo borra (204). Si ya se usó, lo desactiva y devuelve el cupón (200)
export const deleteCoupon = createAsyncThunk('coupons/deleteCoupon', async (id) => {
  const { data } = await api.delete(`${ENDPOINT}/${id}`)
  return { id, deactivated: data || null }
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
        const { id, deactivated } = action.payload
        if (deactivated) replaceById(state.items, deactivated)
        else removeById(state.items, id)
      })
      // Al cerrar sesión vuelve al estado inicial (la lista es del admin)
      .addCase(logout, () => initialState)
      .addCase(sessionExpired, () => initialState)
  },
})

export default couponsSlice.reducer

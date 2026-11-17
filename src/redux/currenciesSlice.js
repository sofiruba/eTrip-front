import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api } from './api'
import { replaceById } from './helpers'

/**
 * Monedas para VER los precios (todo se publica y se cobra en pesos). Las cotizaciones vienen del back y las
 * actualiza el admin. La moneda elegida por cada persona es una preferencia del navegador (slice preferences).
 */

const ENDPOINT = '/currencies'

// GET: una sola vez, al abrir la app → [{ code, name, symbol, arsPerUnit, updatedAt }]
export const fetchCurrencies = createAsyncThunk('currencies/fetchCurrencies', async () => {
  const { data } = await api.get(ENDPOINT)
  return data.map((currency) => ({ ...currency, id: currency.code, arsPerUnit: Number(currency.arsPerUnit) }))
})

// PUT (admin): cambia la cotización de una moneda
export const updateCurrencyRate = createAsyncThunk('currencies/updateCurrencyRate', async ({ code, arsPerUnit }) => {
  const { data } = await api.put(`${ENDPOINT}/${code}`, { arsPerUnit })
  return { ...data, id: data.code, arsPerUnit: Number(data.arsPerUnit) }
})

const currenciesSlice = createSlice({
  name: 'currencies',
  initialState: {
    items: [],
    loading: false,
    loaded: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrencies.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCurrencies.fulfilled, (state, action) => {
        state.loading = false
        state.loaded = true
        state.items = action.payload
      })
      .addCase(fetchCurrencies.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      // PUT: findIndex y reemplazo por la que devolvió el back
      .addCase(updateCurrencyRate.fulfilled, (state, action) => {
        replaceById(state.items, action.payload)
      })
  },
})

export default currenciesSlice.reducer

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api } from './api'
import { logout, sessionExpired, updateMe } from './authSlice'
import { toExperience } from './experiencesSlice'
import { addFavorite, removeFavorite } from './favoritesSlice'
import { createOrder } from './ordersSlice'

/**
 * "Para vos": experiencias recomendadas para el usuario logueado, cada una con el motivo.
 * Las calcula el back (GET /experiences/recommended) con sus intereses, lo que guardó y lo que reservó.
 * "Vistos recientemente" vive en este navegador (slice recentlyViewed), así que se los mandamos como parámetro.
 */

// GET /experiences/recommended?viewed=12,5 → [{ experience, reason }]
export const fetchRecommendations = createAsyncThunk('recommendations/fetchRecommendations', async (viewedIds) => {
  const { data } = await api.get('/experiences/recommended', { params: { viewed: viewedIds.join(',') || undefined } })
  return data.map(({ experience, reason }) => ({ experience: toExperience(experience), reason }))
})

const initialState = {
  items: [],
  loading: false,
  loaded: false,
  error: null,
}

// Cambió algo que el back usa para recomendar: la próxima vez que se muestre "Para vos" se vuelve a pedir
function outdated(state) {
  state.loaded = false
}

const recommendationsSlice = createSlice({
  name: 'recommendations',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecommendations.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.loading = false
        state.loaded = true
        state.items = action.payload
      })
      .addCase(fetchRecommendations.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      // Escucha acciones de otros slices: guardar, quitar, cambiar intereses o comprar cambian las recomendaciones
      .addCase(addFavorite.fulfilled, outdated)
      .addCase(removeFavorite.fulfilled, outdated)
      .addCase(updateMe.fulfilled, outdated)
      .addCase(createOrder.fulfilled, outdated)
      // Otra cuenta: se borran las de la anterior
      .addCase(logout, () => initialState)
      .addCase(sessionExpired, () => initialState)
  },
})

export default recommendationsSlice.reducer

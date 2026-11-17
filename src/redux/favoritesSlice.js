import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api } from './api'
import { logout, sessionExpired } from './authSlice'
import { deleteExperience } from './experiencesSlice'

/**
 * Guardados (favoritos) del usuario que inició sesión. Se guardan en el back (tabla `favorites`), así
 * siguen ahí desde cualquier dispositivo. En el store queda solo la lista de ids de experiencia:
 * las tarjetas salen del catálogo, que ya está cargado.
 */

const ENDPOINT = '/favorites'

// GET /favorites → [{ experienceId, createdAt }]. Una sola vez por sesión, la primera vez que hace falta
export const fetchFavorites = createAsyncThunk('favorites/fetchFavorites', async () => {
  const { data } = await api.get(ENDPOINT)
  return data.map((favorite) => favorite.experienceId)
})

// POST /favorites/{experienceId} → { experienceId, createdAt }
export const addFavorite = createAsyncThunk('favorites/addFavorite', async (experienceId) => {
  const { data } = await api.post(`${ENDPOINT}/${experienceId}`)
  return data.experienceId
})

// DELETE /favorites/{experienceId}: el back no devuelve nada, devolvemos el id para que el reducer lo saque
export const removeFavorite = createAsyncThunk('favorites/removeFavorite', async (experienceId) => {
  await api.delete(`${ENDPOINT}/${experienceId}`)
  return experienceId
})

const initialState = {
  ids: [], // ids de experiencia, la guardada más recientemente primero
  loading: false,
  loaded: false,
  error: null,
}

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.loading = false
        state.loaded = true
        state.ids = action.payload
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      // POST: la nueva va primera (sin volver a pedir la lista)
      .addCase(addFavorite.fulfilled, (state, action) => {
        if (!state.ids.includes(action.payload)) state.ids.unshift(action.payload)
      })
      .addCase(removeFavorite.fulfilled, (state, action) => {
        state.ids = state.ids.filter((id) => id !== action.payload)
      })
      // Se dio de baja una experiencia: el back la saca de los guardados de todos
      .addCase(deleteExperience.fulfilled, (state, action) => {
        state.ids = state.ids.filter((id) => id !== action.payload.id)
      })
      // Los guardados son de la cuenta: al cerrar sesión vuelve al estado inicial
      .addCase(logout, () => initialState)
      .addCase(sessionExpired, () => initialState)
  },
})

export default favoritesSlice.reducer

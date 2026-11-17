import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api } from './api'
import { removeById, replaceById } from './helpers'

/**
 * Intereses de PLAN ("Vinos", "Senderismo"…). Viven en la base y los administra el admin.
 * Cada uno trae su categoría (el grupo con el que se muestra) y cuántos planes disponibles tiene,
 * que lo calcula el back. Los usan el registro, el perfil y el editor de experiencias.
 */

const ENDPOINT = '/interests'

// GET: una sola vez, al abrir la app → [{ id, name, categoryId, categoryName, availableExperiences }]
export const fetchInterests = createAsyncThunk('interests/fetchInterests', async () => {
  const { data } = await api.get(ENDPOINT)
  return data
})

// POST: interest = { name, categoryId }
export const createInterest = createAsyncThunk('interests/createInterest', async (newInterest) => {
  const { data } = await api.post(ENDPOINT, newInterest)
  return data
})

// PUT: desestructuramos el id y mandamos el resto en el body. Devolvemos también el nombre anterior:
// las experiencias y el usuario del store guardan los intereses por nombre y lo tienen que cambiar
export const updateInterest = createAsyncThunk('interests/updateInterest', async ({ id, name, categoryId, previousName }) => {
  const { data } = await api.put(`${ENDPOINT}/${id}`, { name, categoryId })
  return { ...data, previousName }
})

// DELETE: el back no devuelve nada; devolvemos id y nombre para sacarlo de la lista y de las experiencias
export const deleteInterest = createAsyncThunk('interests/deleteInterest', async ({ id, name }) => {
  await api.delete(`${ENDPOINT}/${id}`)
  return { id, name }
})

const interestsSlice = createSlice({
  name: 'interests',
  initialState: {
    items: [],
    loading: false,
    loaded: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInterests.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchInterests.fulfilled, (state, action) => {
        state.loading = false
        state.loaded = true
        state.items = action.payload
      })
      .addCase(fetchInterests.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      // POST: me quedo con lo que había y agrego el nuevo al final
      .addCase(createInterest.fulfilled, (state, action) => {
        state.items = [...state.items, action.payload]
      })
      // PUT: findIndex y reemplazo por el que devolvió el back
      .addCase(updateInterest.fulfilled, (state, action) => {
        replaceById(state.items, action.payload)
      })
      .addCase(deleteInterest.fulfilled, (state, action) => {
        removeById(state.items, action.payload.id)
      })
  },
})

export default interestsSlice.reducer

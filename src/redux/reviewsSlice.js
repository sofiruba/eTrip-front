import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, listOf } from './api'
import { logout, sessionExpired } from './authSlice'
import { deleteExperience } from './experiencesSlice'
import { removeById, replaceById, upsertById } from './helpers'

/**
 * Reseñas. Todas las que se van trayendo (de una experiencia, las mías, todas para el admin) se guardan
 * en una sola lista sin repetir; cada pantalla filtra la parte que necesita.
 */

const URL = '/reviews'

// `requested` guarda qué reseñas ya se pidieron ("experience:5", "mine", "all"): los componentes lo miran para no repetir el GET
export const experienceKey = (experienceId) => `experience:${experienceId}`

// ---------- GET ----------

export const fetchReviewsByExperience = createAsyncThunk('reviews/fetchReviewsByExperience', async (experienceId) => {
  const { data } = await api.get(`${URL}/experience/${experienceId}`)
  return listOf(data)
})

export const fetchMyReviews = createAsyncThunk('reviews/fetchMyReviews', async () => {
  const { data } = await api.get(`${URL}/mine`)
  return listOf(data)
})

// Administrador: todas
export const fetchAllReviews = createAsyncThunk('reviews/fetchAllReviews', async () => {
  const { data } = await api.get(URL)
  return listOf(data)
})

// ---------- POST / PUT / DELETE ----------

// POST: newReview = { experienceId, rating, comment }. El back no permite editar reseñas
export const createReview = createAsyncThunk('reviews/createReview', async (newReview) => {
  const { data } = await api.post(URL, newReview)
  return data
})

// DELETE: devolvemos la reseña borrada (la experiencia recalcula su promedio con su puntaje)
export const deleteReview = createAsyncThunk('reviews/deleteReview', async (review) => {
  await api.delete(`${URL}/${review.id}`)
  return review
})

// PUT: el anfitrión responde (o edita, o borra con texto vacío) una reseña → la reseña actualizada
export const replyToReview = createAsyncThunk('reviews/replyToReview', async ({ id, reply }) => {
  const { data } = await api.put(`${URL}/${id}/reply`, { reply })
  return data
})

// ---------- Slice ----------

const initialState = {
  items: [],
  loading: false,
  error: null,
  requested: [],
}

// Los tres GET guardan igual: pending / fulfilled / rejected, cada uno con su clave en `requested`
function addFetchCases(builder, thunk, keyOf) {
  builder
    .addCase(thunk.pending, (state, action) => {
      state.loading = true
      state.error = null
      state.requested.push(keyOf(action.meta.arg))
    })
    .addCase(thunk.fulfilled, (state, action) => {
      state.loading = false
      action.payload.forEach((review) => upsertById(state.items, review))
    })
    .addCase(thunk.rejected, (state, action) => {
      state.loading = false
      state.error = action.error.message
      // Se puede volver a intentar
      state.requested = state.requested.filter((key) => key !== keyOf(action.meta.arg))
    })
}

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    addFetchCases(builder, fetchReviewsByExperience, experienceKey)
    addFetchCases(builder, fetchMyReviews, () => 'mine')
    addFetchCases(builder, fetchAllReviews, () => 'all')

    builder
      .addCase(createReview.fulfilled, (state, action) => {
        state.items.push(action.payload)
      })
      .addCase(replyToReview.fulfilled, (state, action) => {
        replaceById(state.items, action.payload)
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        removeById(state.items, action.payload.id)
      })
      // Se borró una experiencia: el back borra sus reseñas
      .addCase(deleteExperience.fulfilled, (state, action) => {
        state.items = state.items.filter((review) => review.experienceId !== action.payload.id)
      })
      // "Mis reseñas" y "todas" dependen de quién inició sesión
      .addCase(logout, () => initialState)
      .addCase(sessionExpired, () => initialState)
  },
})

export default reviewsSlice.reducer

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, listOf } from './api'
import { logout, sessionExpired } from './authSlice'
import { deleteExperience, toExperience } from './experiencesSlice'
import { removeById, replaceById, upsertById } from './helpers'

/**
 * Reseñas. Todas las que se van trayendo (de una experiencia, las mías, todas para el admin) se guardan
 * en una sola lista sin repetir; cada pantalla filtra la parte que necesita.
 */

const ENDPOINT = '/reviews'

// `requested` guarda qué reseñas ya se pidieron ("experience:5", "mine", "all"): los componentes lo miran para no repetir el GET
export const experienceKey = (experienceId) => `experience:${experienceId}`

// ---------- GET ----------

export const fetchReviewsByExperience = createAsyncThunk('reviews/fetchReviewsByExperience', async (experienceId) => {
  const { data } = await api.get(`${ENDPOINT}/experience/${experienceId}`)
  return listOf(data)
})

export const fetchMyReviews = createAsyncThunk('reviews/fetchMyReviews', async () => {
  const { data } = await api.get(`${ENDPOINT}/mine`)
  return listOf(data)
})

// Administrador: todas
export const fetchAllReviews = createAsyncThunk('reviews/fetchAllReviews', async () => {
  const { data } = await api.get(ENDPOINT)
  return listOf(data)
})

// ---------- POST / PUT / DELETE ----------

// La experiencia como quedó (promedio y cantidad de reseñas los calcula el back). Si ya no se puede ver
// (por ejemplo, se dio de baja), no se actualiza nada
const reloadExperience = (experienceId) =>
  api.get(`/experiences/${experienceId}`).then(({ data }) => toExperience(data)).catch(() => null)

// POST: newReview = { experienceId, rating, comment }. El back no permite editar reseñas
export const createReview = createAsyncThunk('reviews/createReview', async (newReview) => {
  const { data } = await api.post(ENDPOINT, newReview)
  return { review: data, experience: await reloadExperience(newReview.experienceId) }
})

// DELETE: el back no devuelve nada; devolvemos la reseña borrada y la experiencia actualizada
export const deleteReview = createAsyncThunk('reviews/deleteReview', async (review) => {
  await api.delete(`${ENDPOINT}/${review.id}`)
  return { review, experience: await reloadExperience(review.experienceId) }
})

// PUT: el anfitrión responde (o edita, o borra con texto vacío) una reseña → la reseña actualizada
export const replyToReview = createAsyncThunk('reviews/replyToReview', async ({ id, reply }) => {
  const { data } = await api.put(`${ENDPOINT}/${id}/reply`, { reply })
  return data
})

// ---------- Slice ----------

const initialState = {
  items: [],
  loading: false,
  // Qué listas ya se pidieron y cuáles fallaron (clave → mensaje). Una que falló queda pedida:
  // se vuelve a pedir solo con "Reintentar", así un error no dispara pedidos sin fin
  requested: [],
  failed: {},
}

// Los tres GET guardan igual: pending / fulfilled / rejected, cada uno con su clave en `requested`
function addFetchCases(builder, thunk, keyOf) {
  builder
    .addCase(thunk.pending, (state, action) => {
      const key = keyOf(action.meta.arg)
      state.loading = true
      if (!state.requested.includes(key)) state.requested.push(key)
      delete state.failed[key]
    })
    .addCase(thunk.fulfilled, (state, action) => {
      state.loading = false
      action.payload.forEach((review) => upsertById(state.items, review))
    })
    .addCase(thunk.rejected, (state, action) => {
      state.loading = false
      state.failed[keyOf(action.meta.arg)] = action.error.message
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
        state.items.push(action.payload.review)
      })
      .addCase(replyToReview.fulfilled, (state, action) => {
        replaceById(state.items, action.payload)
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        removeById(state.items, action.payload.review.id)
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

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, listOf } from './api'
import { logout, sessionExpired } from './authSlice'
import { updateCategory } from './categoriesSlice'
import { addFavorite, removeFavorite } from './favoritesSlice'
import { removeById, replaceById, upsertById } from './helpers'
import { createReview, deleteReview } from './reviewsSlice'

/**
 * Experiencias (el "producto" del TPO). Todo lo que tiene que ver con la tabla `experience` está en este slice:
 * las acciones (GET, POST, PUT, PATCH, DELETE) y cómo se guarda cada respuesta en el estado global.
 */

const URL = '/experiences'

/**
 * El back manda las fotos en base64 (`imagesBase64`). Las pasamos a un formato que entiende <img src>
 * y dejamos los precios como números.
 */
export function toExperience({ imagesBase64, ...data }) {
  return {
    ...data,
    images: (imagesBase64 ?? []).map((image) => `data:image/jpeg;base64,${image}`),
    price: Number(data.price),
    finalPrice: Number(data.finalPrice ?? data.price),
    discountPercentage: Number(data.discountPercentage ?? 0),
    averageRating: data.averageRating ?? 0,
    reviewCount: data.reviewCount ?? 0,
    tags: data.tags ?? [],
    favoriteCount: Number(data.favoriteCount ?? 0),
  }
}

/** Arma el FormData que espera el back: la parte "experience" (JSON) y las fotos nuevas. */
export function toFormData(experience, photos) {
  const form = new FormData()
  const { title, description, price, location, categoryId, adultsOnly = false, tags = [] } = experience
  form.append('experience', JSON.stringify({ title, description, price, location, categoryId, adultsOnly, tags }))
  photos.forEach((photo) => form.append('images', photo))
  return form
}

// ---------- GET ----------

// Catálogo público (solo activas). Se pide una sola vez, al abrir la app (App.jsx)
export const fetchExperiences = createAsyncThunk('experiences/fetchExperiences', async () => {
  const { data } = await api.get(URL)
  return listOf(data).map(toExperience)
})

// Modo anfitrión: las mías, también las pausadas (se guardan en `managed`)
export const fetchMyExperiences = createAsyncThunk('experiences/fetchMyExperiences', async () => {
  const { data } = await api.get(`${URL}/mine`)
  return listOf(data).map(toExperience)
})

// Panel de admin: todas, también las pausadas y las dadas de baja (se guardan en `managed`)
export const fetchAllExperiences = createAsyncThunk('experiences/fetchAllExperiences', async () => {
  const { data } = await api.get(URL, { params: { includeInactive: true } })
  return listOf(data).map(toExperience)
})

// Una experiencia con TODAS sus fotos (los listados del back solo traen la portada)
export const fetchExperienceById = createAsyncThunk('experiences/fetchExperienceById', async (id) => {
  const { data } = await api.get(`${URL}/${id}`)
  return toExperience(data)
})

// Búsqueda con los filtros que resuelve el back (`query` = "categoryId=2&location=Palermo").
// Cada búsqueda queda guardada con su query: el Home no la vuelve a pedir si ya la tiene
export const searchExperiences = createAsyncThunk('experiences/searchExperiences', async (query) => {
  const { data } = await api.get(`${URL}?${query}`)
  return listOf(data).map(toExperience)
})

// ---------- POST / PUT / PATCH / DELETE ----------

// POST: la experiencia nueva (con sus fotos) → el back devuelve la experiencia creada
export const createExperience = createAsyncThunk('experiences/createExperience', async ({ experience, photos }) => {
  const { data } = await api.post(URL, toFormData(experience, photos))
  return toExperience(data)
})

// PUT: todos los campos. Si `photos` trae fotos, el back reemplaza todas las anteriores
export const updateExperience = createAsyncThunk('experiences/updateExperience', async ({ id, experience, photos }) => {
  const { data } = await api.put(`${URL}/${id}`, toFormData(experience, photos))
  return toExperience(data)
})

// PATCH: solo el campo que cambia (el descuento)
export const updateDiscount = createAsyncThunk('experiences/updateDiscount', async ({ id, discountPercentage }) => {
  const { data } = await api.patch(`${URL}/${id}/discount`, { discountPercentage })
  return toExperience(data)
})

// PATCH: pausar o volver a activar (baja lógica: la experiencia sigue en la base)
export const updateExperienceStatus = createAsyncThunk('experiences/updateExperienceStatus', async ({ id, active }) => {
  const { data } = await api.patch(`${URL}/${id}/status`, null, { params: { active } })
  return toExperience(data)
})

// DELETE (dar de baja): el back reembolsa y avisa a todos los que tenían reservas, cancela sus fechas y la saca
// del catálogo. Devuelve un resumen { removed, cancelledSessions, refundedBookings } que sumamos a la experiencia
// para que cada slice sepa qué sacar y la pantalla pueda contar qué pasó
export const deleteExperience = createAsyncThunk('experiences/deleteExperience', async (experience) => {
  const { data } = await api.delete(`${URL}/${experience.id}`)
  return { ...experience, result: data }
})

// ---------- Slice ----------

const initialState = {
  // Catálogo público: experiencias activas (del listado, con la foto de portada)
  items: [],
  loading: false,
  loaded: false,
  error: null,
  // Modo anfitrión (las mías) o panel de admin (todas), incluidas las pausadas
  managed: { items: [], loading: false, loaded: false, error: null },
  // Detalle de cada experiencia que se abrió, con todas sus fotos: { [id]: { item, loading, error, notFound } }
  details: {},
  // Resultado de cada búsqueda con filtros: { [query]: { items, loading, error } }
  searches: {},
}

// Una experiencia cambió (PUT / PATCH): la reemplazamos donde esté guardada.
// Las búsquedas guardadas se descartan porque el cambio puede sacarla o meterla en un resultado.
function replaceEverywhere(state, updated) {
  replaceById(state.items, updated)
  replaceById(state.managed.items, updated)
  if (state.details[updated.id]) state.details[updated.id].item = updated
  state.searches = {}
}

// Todas las copias de una experiencia que tenemos (para recalcular algo en todas)
const copiesOf = (state, id) =>
  [...state.items, ...state.managed.items, state.details[id]?.item].filter((experience) => experience?.id === id)

// Se publicó (delta = 1) o se borró (delta = -1) una reseña: recalculamos el promedio igual que el back
function applyReview(state, { experienceId, rating }, delta) {
  copiesOf(state, experienceId).forEach((experience) => {
    const count = experience.reviewCount + delta
    const sum = experience.averageRating * experience.reviewCount + rating * delta
    experience.reviewCount = Math.max(count, 0)
    experience.averageRating = count > 0 ? sum / count : 0
  })
}

// Los tres estados de la promesa para la lista del anfitrión / admin
function managedPending(state) {
  state.managed.loading = true
  state.managed.error = null
}
function managedFulfilled(state, action) {
  state.managed.loading = false
  state.managed.loaded = true
  state.managed.items = action.payload
}
function managedRejected(state, action) {
  state.managed.loading = false
  state.managed.error = action.error.message
}

// Al cerrar sesión se olvida lo que era de esa cuenta (las suyas pausadas, el detalle de las que gestionaba)
function forgetAccount(state) {
  state.managed = initialState.managed
  state.details = {}
}

const experiencesSlice = createSlice({
  name: 'experiences',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // GET catálogo: los tres estados de la promesa
      .addCase(fetchExperiences.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchExperiences.fulfilled, (state, action) => {
        state.loading = false
        state.loaded = true
        state.items = action.payload
        // Si se volvió a pedir (por ejemplo, después de cargar datos de prueba), las búsquedas guardadas quedaron viejas
        state.searches = {}
      })
      .addCase(fetchExperiences.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })

      // GET de las que gestiona el anfitrión (las suyas) o el admin (todas): las dos van a `managed`
      .addCase(fetchMyExperiences.pending, managedPending)
      .addCase(fetchMyExperiences.fulfilled, managedFulfilled)
      .addCase(fetchMyExperiences.rejected, managedRejected)
      .addCase(fetchAllExperiences.pending, managedPending)
      .addCase(fetchAllExperiences.fulfilled, managedFulfilled)
      .addCase(fetchAllExperiences.rejected, managedRejected)

      // GET por id (detalle)
      .addCase(fetchExperienceById.pending, (state, action) => {
        state.details[action.meta.arg] = { item: null, loading: true, error: null, notFound: false }
      })
      .addCase(fetchExperienceById.fulfilled, (state, action) => {
        state.details[action.meta.arg] = { item: action.payload, loading: false, error: null, notFound: false }
      })
      .addCase(fetchExperienceById.rejected, (state, action) => {
        // 404 / 403: no existe o está pausada y no es tuya
        const notFound = ['403', '404'].includes(action.error.code)
        state.details[action.meta.arg] = { item: null, loading: false, error: action.error.message, notFound }
      })

      // GET con filtros: cada búsqueda se guarda con su query
      .addCase(searchExperiences.pending, (state, action) => {
        state.searches[action.meta.arg] = { items: [], loading: true, error: null }
      })
      .addCase(searchExperiences.fulfilled, (state, action) => {
        state.searches[action.meta.arg] = { items: action.payload, loading: false, error: null }
      })
      .addCase(searchExperiences.rejected, (state, action) => {
        state.searches[action.meta.arg] = { items: [], loading: false, error: action.error.message }
      })

      // POST: me quedo con lo que había y agrego la experiencia nueva (sin volver a pedir el catálogo)
      .addCase(createExperience.fulfilled, (state, action) => {
        const created = action.payload
        if (created.active) state.items.push(created)
        if (state.managed.loaded) state.managed.items.push(created)
        state.details[created.id] = { item: created, loading: false, error: null, notFound: false }
        state.searches = {}
      })

      // PUT y PATCH: findIndex y reemplazo por lo que devolvió el back
      .addCase(updateExperience.fulfilled, (state, action) => replaceEverywhere(state, action.payload))
      .addCase(updateDiscount.fulfilled, (state, action) => replaceEverywhere(state, action.payload))
      .addCase(updateExperienceStatus.fulfilled, (state, action) => {
        const updated = action.payload
        replaceEverywhere(state, updated)
        // Una pausada sale del catálogo público; una que se vuelve a activar, entra
        if (updated.active) upsertById(state.items, updated)
        else removeById(state.items, updated.id)
      })

      // DELETE: la sacamos de todas las listas
      .addCase(deleteExperience.fulfilled, (state, action) => {
        const { id } = action.payload
        removeById(state.items, id)
        removeById(state.managed.items, id)
        delete state.details[id]
        state.searches = {}
      })

      // Cambios de otras entidades que se ven en las experiencias
      .addCase(updateCategory.fulfilled, (state, action) => {
        const category = action.payload
        const all = [...state.items, ...state.managed.items, ...Object.values(state.details).map((detail) => detail.item)]
        all.forEach((experience) => {
          if (experience?.categoryId === category.id) experience.categoryName = category.name
        })
      })
      .addCase(createReview.fulfilled, (state, action) => applyReview(state, action.payload, 1))
      .addCase(deleteReview.fulfilled, (state, action) => applyReview(state, action.payload, -1))
      // Guardados: el contador de "guardada por N personas" sube o baja sin volver a pedir la experiencia
      .addCase(addFavorite.fulfilled, (state, action) => {
        copiesOf(state, action.payload).forEach((experience) => {
          experience.favoriteCount += 1
        })
      })
      .addCase(removeFavorite.fulfilled, (state, action) => {
        copiesOf(state, action.payload).forEach((experience) => {
          experience.favoriteCount = Math.max(experience.favoriteCount - 1, 0)
        })
      })

      .addCase(logout, forgetAccount)
      .addCase(sessionExpired, forgetAccount)
  },
})

export default experiencesSlice.reducer

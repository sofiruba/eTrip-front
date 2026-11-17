import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, listOf } from './api'
import { logout, sessionExpired, updateMe } from './authSlice'
import { updateCategory } from './categoriesSlice'
import { addFavorite, removeFavorite } from './favoritesSlice'
import { deleteInterest, updateInterest } from './interestsSlice'
import { removeById, replaceById, upsertById } from './helpers'
import { createOrder } from './ordersSlice'
import { createReview, deleteReview } from './reviewsSlice'

/**
 * Experiencias (el "producto" del TPO). Todo lo que tiene que ver con la tabla `experience` está en este slice:
 * las acciones (GET, POST, PUT, PATCH, DELETE) y cómo se guarda cada respuesta en el estado global.
 */

const ENDPOINT = '/experiences'

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
function toFormData(experience, photos) {
  const form = new FormData()
  const { title, description, price, location, categoryId, adultsOnly = false, tags = [] } = experience
  form.append('experience', JSON.stringify({ title, description, price, location, categoryId, adultsOnly, tags }))
  photos.forEach((photo) => form.append('images', photo))
  return form
}

// ---------- GET ----------

// Catálogo público (solo activas). Se pide una sola vez, al abrir la app (App.jsx)
export const fetchExperiences = createAsyncThunk('experiences/fetchExperiences', async () => {
  const { data } = await api.get(ENDPOINT)
  return listOf(data).map(toExperience)
})

// Modo anfitrión: las mías, también las pausadas (se guardan en `managed`)
export const fetchMyExperiences = createAsyncThunk('experiences/fetchMyExperiences', async () => {
  const { data } = await api.get(`${ENDPOINT}/mine`)
  return listOf(data).map(toExperience)
})

// Panel de admin: todas, también las pausadas y las dadas de baja (se guardan en `managed`)
export const fetchAllExperiences = createAsyncThunk('experiences/fetchAllExperiences', async () => {
  const { data } = await api.get(ENDPOINT, { params: { includeInactive: true } })
  return listOf(data).map(toExperience)
})

// Una experiencia con TODAS sus fotos (los listados del back solo traen la portada)
export const fetchExperienceById = createAsyncThunk('experiences/fetchExperienceById', async (id) => {
  const { data } = await api.get(`${ENDPOINT}/${id}`)
  return toExperience(data)
})

// Búsqueda con los filtros que resuelve el back (`query` = "categoryId=2&location=Palermo").
// Cada búsqueda queda guardada con su query: el Home no la vuelve a pedir si ya la tiene
export const searchExperiences = createAsyncThunk('experiences/searchExperiences', async (query) => {
  const { data } = await api.get(`${ENDPOINT}?${query}`)
  return listOf(data).map(toExperience)
})

// ---------- POST / PUT / PATCH / DELETE ----------

// POST: la experiencia nueva (con sus fotos) → el back devuelve la experiencia creada
export const createExperience = createAsyncThunk('experiences/createExperience', async ({ experience, photos }) => {
  const { data } = await api.post(ENDPOINT, toFormData(experience, photos))
  return toExperience(data)
})

// PUT: todos los campos. Si `photos` trae fotos, el back reemplaza todas las anteriores
export const updateExperience = createAsyncThunk('experiences/updateExperience', async ({ id, experience, photos }) => {
  const { data } = await api.put(`${ENDPOINT}/${id}`, toFormData(experience, photos))
  return toExperience(data)
})

// PATCH: solo el campo que cambia (el descuento)
export const updateDiscount = createAsyncThunk('experiences/updateDiscount', async ({ id, discountPercentage }) => {
  const { data } = await api.patch(`${ENDPOINT}/${id}/discount`, { discountPercentage })
  return toExperience(data)
})

// PATCH: pausar o volver a activar (baja lógica: la experiencia sigue en la base)
export const updateExperienceStatus = createAsyncThunk('experiences/updateExperienceStatus', async ({ id, active }) => {
  const { data } = await api.patch(`${ENDPOINT}/${id}/status`, null, { params: { active } })
  return toExperience(data)
})

// DELETE (dar de baja): el back reembolsa y avisa a todos los que tenían reservas, cancela sus fechas y la saca
// del catálogo. Devuelve un resumen { removed, cancelledSessions, refundedBookings } que sumamos a la experiencia
// para que cada slice sepa qué sacar y la pantalla pueda contar qué pasó
export const deleteExperience = createAsyncThunk('experiences/deleteExperience', async (experience) => {
  const { data } = await api.delete(`${ENDPOINT}/${experience.id}`)
  return { ...experience, result: data }
})

// GET /experiences/recommended?viewed=12,5 → [{ experience, reason }]: "Para vos", lo calcula el back con los
// intereses del usuario, lo que guardó y lo que reservó. "Vistos recientemente" vive en este navegador, por eso se manda
export const fetchRecommendations = createAsyncThunk('experiences/fetchRecommendations', async (viewedIds) => {
  const { data } = await api.get(`${ENDPOINT}/recommended`, { params: { viewed: viewedIds.join(',') || undefined } })
  return data.map(({ experience, reason }) => ({ experience: toExperience(experience), reason }))
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
  // "Para vos" del usuario logueado: [{ experience, reason }]
  recommended: { items: [], loading: false, loaded: false, error: null },
}

// Cambió algo que el back usa para recomendar: "Para vos" se vuelve a pedir la próxima vez que se muestre
function recommendationsOutdated(state) {
  state.recommended.loaded = false
}

// Una experiencia cambió (PUT / PATCH): la reemplazamos donde esté guardada.
// Las búsquedas guardadas se descartan porque el cambio puede sacarla o meterla en un resultado.
function replaceEverywhere(state, updated) {
  replaceById(state.items, updated)
  replaceById(state.managed.items, updated)
  if (state.details[updated.id]) state.details[updated.id].item = updated
  state.searches = {}
}

/** Todas las copias de experiencias que hay en el store: catálogo, panel y detalles. */
const allCopies = (state) => [...state.items, ...state.managed.items, ...Object.values(state.details).map((detail) => detail.item)]

// Todas las copias de una experiencia que tenemos (para recalcular algo en todas)
const copiesOf = (state, id) =>
  [...state.items, ...state.managed.items, state.details[id]?.item].filter((experience) => experience?.id === id)

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
  state.recommended = initialState.recommended
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
        // Si se volvió a pedir el catálogo, las búsquedas guardadas quedaron viejas
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
        allCopies(state).forEach((experience) => {
          if (experience?.categoryId === category.id) experience.categoryName = category.name
        })
      })
      // El admin renombró o borró un interés: las experiencias lo tienen por nombre
      .addCase(updateInterest.fulfilled, (state, action) => {
        const { previousName, name } = action.payload
        allCopies(state).forEach((experience) => {
          if (experience) experience.tags = experience.tags.map((tag) => (tag === previousName ? name : tag))
        })
      })
      .addCase(deleteInterest.fulfilled, (state, action) => {
        allCopies(state).forEach((experience) => {
          if (experience) experience.tags = experience.tags.filter((tag) => tag !== action.payload.name)
        })
        state.searches = {}
      })
      // Se publicó o se borró una reseña: la experiencia viene del back con el promedio ya recalculado
      .addCase(createReview.fulfilled, (state, action) => {
        if (action.payload.experience) replaceEverywhere(state, action.payload.experience)
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        if (action.payload.experience) replaceEverywhere(state, action.payload.experience)
      })
      // Guardados: el contador de "guardada por N personas" sube o baja sin volver a pedir la experiencia
      .addCase(addFavorite.fulfilled, (state, action) => {
        copiesOf(state, action.payload).forEach((experience) => {
          experience.favoriteCount += 1
        })
        recommendationsOutdated(state)
      })
      .addCase(removeFavorite.fulfilled, (state, action) => {
        copiesOf(state, action.payload).forEach((experience) => {
          experience.favoriteCount = Math.max(experience.favoriteCount - 1, 0)
        })
        recommendationsOutdated(state)
      })

      // "Para vos"
      .addCase(fetchRecommendations.pending, (state) => {
        state.recommended.loading = true
        state.recommended.error = null
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.recommended = { items: action.payload, loading: false, loaded: true, error: null }
      })
      .addCase(fetchRecommendations.rejected, (state, action) => {
        state.recommended.loading = false
        state.recommended.error = action.error.message
      })
      // Cambiar los intereses o comprar también cambian las recomendaciones
      .addCase(updateMe.fulfilled, recommendationsOutdated)
      .addCase(createOrder.fulfilled, recommendationsOutdated)

      .addCase(logout, forgetAccount)
      .addCase(sessionExpired, forgetAccount)
  },
})

export default experiencesSlice.reducer

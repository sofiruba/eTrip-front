import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit'
import { addSessionInfo } from '../utils/experiences'
import { api, listOf } from './api'
import { sessionEnded } from './authSlice'
import { updateCategory } from './categoriesSlice'
import { onlyOnce, removeById, replaceById, upsertById } from './helpers'
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
  }
}

/** Arma el FormData que espera el back: la parte "experience" (JSON) y las fotos nuevas. */
export function toFormData(experience, photos) {
  const form = new FormData()
  const { title, description, price, location, categoryId, adultsOnly = false } = experience
  form.append('experience', JSON.stringify({ title, description, price, location, categoryId, adultsOnly }))
  photos.forEach((photo) => form.append('images', photo))
  return form
}

// ---------- GET ----------

// Catálogo público (solo activas). Se pide una sola vez, al abrir la app (App.jsx)
export const fetchExperiences = createAsyncThunk(
  'experiences/fetchExperiences',
  async () => {
    const { data } = await api.get(URL)
    return listOf(data).map(toExperience)
  },
  onlyOnce((state) => state.experiences),
)

// Las que gestiona quien inició sesión, también las pausadas: el anfitrión ve las suyas y el admin, todas
export const fetchManagedExperiences = createAsyncThunk(
  'experiences/fetchManagedExperiences',
  async (_, { getState }) => {
    const isAdmin = getState().auth.user?.role === 'ADMIN'
    const { data } = await api.get(isAdmin ? `${URL}?includeInactive=true` : `${URL}/mine`)
    return listOf(data).map(toExperience)
  },
  onlyOnce((state) => state.experiences.managed),
)

// Una experiencia con TODAS sus fotos (los listados del back solo traen la portada). Una vez por experiencia
export const fetchExperienceById = createAsyncThunk(
  'experiences/fetchExperienceById',
  async (id) => {
    const { data } = await api.get(`${URL}/${id}`)
    return toExperience(data)
  },
  {
    condition: (id, { getState }) => {
      const detail = getState().experiences.details[id]
      return !detail || Boolean(detail.error)
    },
  },
)

// Búsqueda con los filtros que resuelve el back (`query` = "categoryId=2&location=Palermo").
// Cada búsqueda queda guardada: si se vuelve a una que ya se hizo, no se repite el GET
export const searchExperiences = createAsyncThunk(
  'experiences/searchExperiences',
  async (query) => {
    const { data } = await api.get(`${URL}?${query}`)
    return listOf(data).map(toExperience)
  },
  {
    condition: (query, { getState }) => {
      const search = getState().experiences.searches[query]
      return !search || Boolean(search.error)
    },
  },
)

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

// DELETE: el back no devuelve nada, así que devolvemos la experiencia borrada para que cada slice sepa qué sacar
export const deleteExperience = createAsyncThunk('experiences/deleteExperience', async (experience) => {
  await api.delete(`${URL}/${experience.id}`)
  return experience
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
        // Si se volvió a pedir a propósito (después de cargar datos de prueba), las búsquedas guardadas quedaron viejas
        if (action.meta.arg?.force) state.searches = {}
      })
      .addCase(fetchExperiences.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })

      // GET de las que gestiona el anfitrión / admin
      .addCase(fetchManagedExperiences.pending, (state) => {
        state.managed.loading = true
        state.managed.error = null
      })
      .addCase(fetchManagedExperiences.fulfilled, (state, action) => {
        state.managed.loading = false
        state.managed.loaded = true
        state.managed.items = action.payload
      })
      .addCase(fetchManagedExperiences.rejected, (state, action) => {
        state.managed.loading = false
        state.managed.error = action.error.message
      })

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

      // Al cerrar sesión se olvida lo que era de esa cuenta (las suyas pausadas, el detalle de las que gestionaba)
      .addMatcher(sessionEnded, (state) => {
        state.managed = initialState.managed
        state.details = {}
      })
  },
})

// ---------- Selectores ----------

/** Catálogo con la info de sus fechas (próxima fecha con lugar, lugares que quedan…). Se recalcula solo si cambian. */
export const selectCatalog = createSelector([(state) => state.experiences.items, (state) => state.sessions.items], addSessionInfo)

/** Lo mismo para el modo anfitrión / panel de admin (con todas las fechas, también las pasadas y canceladas). */
export const selectManagedExperiences = createSelector(
  [(state) => state.experiences.managed.items, (state) => state.sessions.managed.items],
  addSessionInfo,
)

/** Estado de la carga inicial del catálogo (experiencias, fechas y categorías): { loading, error }. */
export const selectCatalogStatus = createSelector(
  [(state) => state.experiences, (state) => state.sessions, (state) => state.categories],
  (...lists) => {
    const error = lists.find((list) => list.error)?.error ?? null
    return { loading: !error && !lists.every((list) => list.loaded), error }
  },
)

export default experiencesSlice.reducer

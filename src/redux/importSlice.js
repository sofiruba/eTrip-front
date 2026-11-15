import axios from 'axios'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { addHours, daysFromToday } from '../utils/dates'
import { api, listOf, withToken } from './api'
import { toFormData } from './experiencesSlice'

/**
 * Herramienta del panel de admin: carga un set de datos de prueba (JSON) usando los endpoints que ya existen en el back.
 * Orden: categorías y cupones (como admin) → usuarios → experiencias y fechas de cada usuario
 * (con el token de ESE usuario, así queda como anfitrión). Lo que ya existe se saltea, así que se puede cargar varias veces.
 * Cada paso se anota en `log` (estado global), que es lo que muestra el panel mientras corre.
 */

// Foto que se usa si la experiencia no trae `image`
const DEFAULT_IMAGE = '/ejemplos/la-boca.jpg'

/** Ejecuta `fn` para cada elemento, de a uno: espera que termine el anterior antes de seguir. */
function inOrder(items = [], fn) {
  return items.reduce((previous, item) => previous.then(() => fn(item)), Promise.resolve())
}

function importCategory(category, categoryIds, log) {
  if (categoryIds[category.name.toLowerCase()]) return log(`Categoría "${category.name}" ya existía`, 'skip')
  return api
    .post('/experience-categories', category)
    .then(({ data: saved }) => {
      categoryIds[saved.name.toLowerCase()] = saved.id
      log(`Categoría "${saved.name}" creada`, 'ok')
    })
    .catch((error) => log(`Categoría "${category.name}": ${error.message}`, 'error'))
}

function importCoupon(coupon, existing, log) {
  if (existing.some((entry) => entry.code === coupon.code)) return log(`Cupón ${coupon.code} ya existía`, 'skip')
  // Si no se indican, vale desde hoy y por 90 días
  const body = { active: true, validFrom: daysFromToday(0, '00:00'), validUntil: daysFromToday(90, '23:59'), ...coupon }
  return api
    .post('/discount-coupons', body)
    .then(({ data: saved }) => log(`Cupón ${saved.code} creado (${saved.percentage}%)`, 'ok'))
    .catch((error) => log(`Cupón ${coupon.code}: ${error.message}`, 'error'))
}

function importUser(user, categoryIds, log) {
  const { username, firstname, lastname, email, password } = user
  // skipAuth: el registro y el login son públicos, no tienen que llevar el token del admin
  return api
    .post('/api/v1/auth/register', { username, firstname, lastname, email, password }, { skipAuth: true })
    .then(({ data }) => {
      log(`Usuario ${email} creado`, 'ok')
      return data.access_token
    })
    // Si ya existía, iniciamos sesión con la misma contraseña para seguir con sus experiencias
    .catch(() =>
      api.post('/api/v1/auth/authenticate', { usernameOrEmail: email, password }, { skipAuth: true }).then(({ data }) => {
        log(`Usuario ${email} ya existía`, 'skip')
        return data.access_token
      }),
    )
    .then((token) =>
      api
        .get('/experiences/mine', withToken(token))
        .then(({ data }) =>
          inOrder(user.experiences, (experience) => importExperience(experience, listOf(data), token, categoryIds, log)),
        ),
    )
    .catch((error) => log(`Usuario ${email}: ${error.message}`, 'error'))
}

function importExperience(experience, mine, token, categoryIds, log) {
  if (mine.some((entry) => entry.title === experience.title)) return log(`  Experiencia "${experience.title}" ya existía`, 'skip')

  const categoryId = categoryIds[(experience.category ?? '').toLowerCase()]
  if (!categoryId) return log(`  Experiencia "${experience.title}": no existe la categoría "${experience.category}"`, 'error')

  return getPhoto(experience)
    .then((photo) => api.post('/experiences', toFormData({ ...experience, categoryId }, [photo]), withToken(token)))
    .then(({ data: saved }) => {
      log(`  Experiencia "${saved.title}" creada`, 'ok')
      if (!experience.discountPercentage) return saved
      return api
        .patch(`/experiences/${saved.id}/discount`, { discountPercentage: experience.discountPercentage }, withToken(token))
        .then(() => saved)
    })
    .then((saved) => inOrder(experience.sessions, (session) => importSession(session, saved, token, log)))
    .catch((error) => log(`  Experiencia "${experience.title}": ${error.message}`, 'error'))
}

function importSession(session, experience, token, log) {
  // La fecha se calcula desde hoy (`inDays` días, a la hora `time`): así siempre queda en el futuro
  const startsAt = daysFromToday(session.inDays ?? 7, session.time ?? '18:00')
  const body = { experienceId: experience.id, startsAt, endsAt: addHours(startsAt, session.hours ?? 2), capacity: session.capacity ?? 10 }
  return api
    .post('/experience-sessions', body, withToken(token))
    .then(() => log(`    Fecha ${startsAt.slice(0, 16).replace('T', ' ')} creada`, 'ok'))
    .catch((error) => log(`    Fecha de "${experience.title}": ${error.message}`, 'error'))
}

/** Descarga la foto de la experiencia (`image` o la de ejemplo) y la convierte en un archivo para mandar al back. */
function getPhoto(experience) {
  return axios
    .get(experience.image || DEFAULT_IMAGE, { responseType: 'blob' })
    .then(({ data: blob }) => new File([blob], 'foto.jpg', { type: blob.type }))
}

// Cada paso se anota en el log con la acción logAdded (el thunk recibe dispatch)
export const importData = createAsyncThunk('dataImport/importData', async (data, { dispatch }) => {
  const log = (message, type) => dispatch(logAdded({ message, type }))

  // Para no duplicar: primero vemos qué categorías y cupones ya existen
  const categoryIds = {} // nombre en minúscula → id
  const { data: categories } = await api.get('/experience-categories')
  listOf(categories).forEach((category) => {
    categoryIds[category.name.toLowerCase()] = category.id
  })
  await inOrder(data.categories, (category) => importCategory(category, categoryIds, log))

  const { data: coupons } = await api.get('/discount-coupons')
  await inOrder(data.coupons, (coupon) => importCoupon(coupon, listOf(coupons), log))

  await inOrder(data.users, (user) => importUser(user, categoryIds, log))
  // Al terminar, el panel vuelve a pedir el catálogo y sus listas (ver DataImportAdmin.jsx)
})

const importSlice = createSlice({
  name: 'dataImport',
  initialState: {
    log: [], // [{ message, type: 'ok' | 'skip' | 'error' }]
    running: false,
  },
  reducers: {
    logAdded: (state, action) => {
      state.log.push(action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(importData.pending, (state) => {
        state.running = true
        state.log = []
      })
      .addCase(importData.fulfilled, (state) => {
        state.running = false
      })
      .addCase(importData.rejected, (state, action) => {
        state.running = false
        state.log.push({ message: action.error.message, type: 'error' })
      })
  },
})

const { logAdded } = importSlice.actions

export default importSlice.reducer

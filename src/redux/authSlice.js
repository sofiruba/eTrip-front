import { createAsyncThunk, createSelector, createSlice, isAnyOf } from '@reduxjs/toolkit'
import { api, withToken } from './api'
import { createExperience, deleteExperience } from './experiencesSlice'
import { createOrder } from './ordersSlice'
import { createReview, deleteReview } from './reviewsSlice'

/**
 * Sesión del usuario. El token vive en el estado global (antes lo pasábamos por todos lados):
 * axios lo lee de acá en cada pedido (ver api.js) y redux-persist lo guarda para que la sesión
 * siga abierta al recargar la página (ver store.js).
 */

const URL = '/api/v1/auth'

// ---------- Acciones asíncronas ----------

// POST /api/v1/auth/authenticate → { access_token }. Con ese token pedimos quién es el usuario (GET /users/me)
export const login = createAsyncThunk('auth/login', async ({ usernameOrEmail, password }) => {
  const { data } = await api.post(`${URL}/authenticate`, { usernameOrEmail, password })
  const { data: user } = await api.get('/users/me', withToken(data.access_token))
  return { token: data.access_token, user }
})

// POST /api/v1/auth/register → { access_token }. Los intereses no los guarda el back: quedan en el navegador
export const register = createAsyncThunk('auth/register', async ({ account, interests }) => {
  const { username, firstname, lastname, email, password } = account
  const { data } = await api.post(`${URL}/register`, { username, firstname, lastname, email, password })
  const { data: user } = await api.get('/users/me', withToken(data.access_token))
  return { token: data.access_token, user, interests }
})

// GET /api/v1/auth/availability → { usernameAvailable, emailAvailable }. Solo lo usa el formulario de registro
export const checkAvailability = createAsyncThunk('auth/checkAvailability', async ({ username, email }) => {
  const { data } = await api.get(`${URL}/availability`, { params: { username: username || undefined, email: email || undefined } })
  return data
})

// POST /api/v1/auth/forgot-password → { devCode }. El mail todavía no se manda: en desarrollo el código viene en devCode
export const requestPasswordReset = createAsyncThunk('auth/requestPasswordReset', async (usernameOrEmail) => {
  const { data } = await api.post(`${URL}/forgot-password`, { usernameOrEmail })
  return data
})

// POST /api/v1/auth/verify-reset-code → 204 si el código es válido
export const verifyResetCode = createAsyncThunk('auth/verifyResetCode', async ({ usernameOrEmail, code }) => {
  await api.post(`${URL}/verify-reset-code`, { usernameOrEmail, code })
})

// POST /api/v1/auth/reset-password → { access_token }: cambia la contraseña y deja la sesión iniciada
export const resetPassword = createAsyncThunk('auth/resetPassword', async ({ usernameOrEmail, code, newPassword }) => {
  const { data } = await api.post(`${URL}/reset-password`, { usernameOrEmail, code, newPassword })
  const { data: user } = await api.get('/users/me', withToken(data.access_token))
  return { token: data.access_token, user }
})

// GET /users/me: al abrir la app con una sesión guardada, para tener el rol y los contadores al día.
// La condición evita pedirlo dos veces si ya está en camino (en desarrollo StrictMode monta los efectos dos veces)
export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async () => {
    const { data } = await api.get('/users/me')
    return data
  },
  { condition: (_, { getState }) => Boolean(getState().auth.token) && !getState().auth.loadingUser },
)

// PUT /users/me: el back solo guarda nombre y apellido
export const updateMe = createAsyncThunk('auth/updateMe', async ({ firstName, lastName }) => {
  const { data } = await api.put('/users/me', { firstName, lastName })
  return data
})

// ---------- Slice ----------

const initialState = {
  token: null,
  user: null,
  // Bio, ciudad, intereses y foto no existen en el back: se guardan en este navegador, por usuario ({ [userId]: {...} })
  profileExtras: {},
  // true mientras se pide /users/me (no se persiste)
  loadingUser: false,
  // Modal de login / registro / recuperar contraseña: qué vista está abierta (null = cerrado) y a dónde ir después
  authModal: { mode: null, redirect: null },
}

// Login, registro y recuperar contraseña terminan igual: guardamos el token y el usuario y cerramos el modal
function startSession(state, action) {
  state.token = action.payload.token
  state.user = action.payload.user
  state.authModal.mode = null
}

// Suma o resta un contador del perfil (los calcula el back): así no hace falta volver a pedir /users/me
function addToCounter(state, field, amount) {
  if (state.user) state.user[field] = Math.max((state.user[field] ?? 0) + amount, 0)
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.token = null
      state.user = null
    },
    // El token venció mientras se usaba la app: se cierra la sesión y se abre el login sobre la página actual
    sessionExpired: (state) => {
      state.token = null
      state.user = null
      state.authModal = { mode: 'login', redirect: null }
    },
    // dispatch(openAuth('register', '/anfitrion')): `prepare` arma el payload con los dos parámetros
    openAuth: {
      reducer: (state, action) => {
        state.authModal = action.payload
      },
      prepare: (mode = 'login', redirect = null) => ({ payload: { mode, redirect } }),
    },
    closeAuth: (state) => {
      state.authModal.mode = null
    },
    // Lo que el back no guarda (bio, ciudad, intereses, foto) del usuario que inició sesión
    updateProfileExtras: (state, action) => {
      const userId = state.user.id
      state.profileExtras[userId] = { ...state.profileExtras[userId], ...action.payload }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.fulfilled, startSession)
      .addCase(resetPassword.fulfilled, startSession)
      .addCase(register.fulfilled, (state, action) => {
        startSession(state, action)
        state.profileExtras[action.payload.user.id] = { interests: action.payload.interests }
      })
      .addCase(fetchMe.pending, (state) => {
        state.loadingUser = true
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loadingUser = false
        state.user = action.payload
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.loadingUser = false
        // 4xx = token inválido o cuenta desactivada: se cierra la sesión. Si el back no respondió, la dejamos como estaba
        if (action.error.code?.startsWith('4')) {
          state.token = null
          state.user = null
        }
      })
      .addCase(updateMe.fulfilled, (state, action) => {
        state.user = action.payload
      })
      // Contadores del perfil
      .addCase(createOrder.fulfilled, (state) => addToCounter(state, 'bookingsCount', 1))
      .addCase(createReview.fulfilled, (state) => addToCounter(state, 'reviewsCount', 1))
      .addCase(deleteReview.fulfilled, (state, action) => {
        if (action.payload.userId === state.user?.id) addToCounter(state, 'reviewsCount', -1)
      })
      .addCase(createExperience.fulfilled, (state) => addToCounter(state, 'publishedExperiences', 1))
      .addCase(deleteExperience.fulfilled, (state, action) => {
        if (action.payload.publisherId === state.user?.id) addToCounter(state, 'publishedExperiences', -1)
      })
  },
})

export const { logout, sessionExpired, openAuth, closeAuth, updateProfileExtras } = authSlice.actions

/** Cualquiera de las dos formas de terminar la sesión: los slices con datos del usuario vuelven a su estado inicial. */
export const sessionEnded = isAnyOf(logout, sessionExpired)

// ---------- Selectores ----------

/** El usuario con lo que se guarda en el navegador (bio, ciudad, intereses, foto). Se recalcula solo si cambia. */
export const selectUser = createSelector(
  [(state) => state.auth.user, (state) => state.auth.profileExtras],
  (user, extras) => (user ? { ...user, ...extras[user.id] } : null),
)

export const selectIsAdmin = (state) => state.auth.user?.role === 'ADMIN'

export default authSlice.reducer

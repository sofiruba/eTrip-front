import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, withToken } from './api'
import { createExperience, deleteExperience } from './experiencesSlice'
import { toUser } from './helpers'
import { deleteInterest, updateInterest } from './interestsSlice'
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
  return { token: data.access_token, user: toUser(user) }
})

// POST /api/v1/auth/register → { email }. Todavía NO hay sesión: el back le manda un código al email y la cuenta
// queda sin verificar hasta que se ingrese (verifyEmail). Los intereses se guardan en el back (el Home los usa en "Para vos")
export const register = createAsyncThunk('auth/register', async ({ account, interests }) => {
  const { username, firstname, lastname, email, password } = account
  const { data } = await api.post(`${URL}/register`, { username, firstname, lastname, email, password, interests })
  return data
})

// POST /api/v1/auth/verify-email → { access_token }: confirma el email con el código y deja la sesión iniciada
export const verifyEmail = createAsyncThunk('auth/verifyEmail', async ({ usernameOrEmail, code }) => {
  const { data } = await api.post(`${URL}/verify-email`, { usernameOrEmail, code })
  const { data: user } = await api.get('/users/me', withToken(data.access_token))
  return { token: data.access_token, user: toUser(user) }
})

// POST /api/v1/auth/resend-verification → 204: manda otro código de verificación
export const resendVerification = createAsyncThunk('auth/resendVerification', async (usernameOrEmail) => {
  await api.post(`${URL}/resend-verification`, { usernameOrEmail })
})

// GET /api/v1/auth/availability → { usernameAvailable, emailAvailable }. Solo lo usa el formulario de registro
export const checkAvailability = createAsyncThunk('auth/checkAvailability', async ({ username, email }) => {
  const { data } = await api.get(`${URL}/availability`, { params: { username: username || undefined, email: email || undefined } })
  return data
})

// POST /api/v1/auth/forgot-password → 204: el back le manda el código al email de la cuenta
export const requestPasswordReset = createAsyncThunk('auth/requestPasswordReset', async (usernameOrEmail) => {
  await api.post(`${URL}/forgot-password`, { usernameOrEmail })
})

// POST /api/v1/auth/verify-reset-code → 204 si el código es válido
export const verifyResetCode = createAsyncThunk('auth/verifyResetCode', async ({ usernameOrEmail, code }) => {
  await api.post(`${URL}/verify-reset-code`, { usernameOrEmail, code })
})

// POST /api/v1/auth/reset-password → { access_token }: cambia la contraseña y deja la sesión iniciada
export const resetPassword = createAsyncThunk('auth/resetPassword', async ({ usernameOrEmail, code, newPassword }) => {
  const { data } = await api.post(`${URL}/reset-password`, { usernameOrEmail, code, newPassword })
  const { data: user } = await api.get('/users/me', withToken(data.access_token))
  return { token: data.access_token, user: toUser(user) }
})

// GET /users/me: al abrir la app con una sesión guardada, para tener el rol y los contadores al día
export const fetchMe = createAsyncThunk('auth/fetchMe', async () => {
  const { data } = await api.get('/users/me')
  return toUser(data)
})

// PUT /users/me: nombre, apellido, bio, ciudad, foto (avatarBase64) e intereses. Se manda solo lo que cambia;
// el back devuelve el usuario completo y el reducer lo guarda
export const updateMe = createAsyncThunk('auth/updateMe', async (changes) => {
  const { data } = await api.put('/users/me', changes)
  return toUser(data)
})

// ---------- Slice ----------

const initialState = {
  token: null,
  // El usuario que devuelve el back (con bio, ciudad, intereses y foto, que desde la 3ra entrega se guardan en el back)
  user: null,
  // Modal de login / registro / recuperar contraseña: qué vista está abierta (null = cerrado) y a dónde ir después
  authModal: { mode: null, redirect: null },
}

// Login, verificar el email y recuperar contraseña terminan igual: guardamos el token y el usuario y cerramos el modal
function startSession(state, action) {
  state.token = action.payload.token
  state.user = action.payload.user
  state.authModal.mode = null
}

// Al cerrar sesión (a mano o porque venció el token)
function endSession(state) {
  state.token = null
  state.user = null
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
      endSession(state)
    },
    // El token venció mientras se usaba la app: se cierra la sesión y se abre el login sobre la página actual
    sessionExpired: (state) => {
      endSession(state)
      state.authModal = { mode: 'login', redirect: null }
    },
    // dispatch(openAuth({ mode: 'register', redirect: '/anfitrion' }))
    openAuth: (state, action) => {
      state.authModal = { mode: action.payload.mode ?? 'login', redirect: action.payload.redirect ?? null }
    },
    closeAuth: (state) => {
      state.authModal.mode = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.fulfilled, startSession)
      .addCase(verifyEmail.fulfilled, startSession)
      .addCase(resetPassword.fulfilled, startSession)
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload
      })
      .addCase(fetchMe.rejected, (state, action) => {
        // 4xx = token inválido o cuenta desactivada: se cierra la sesión. Si el back no respondió, la dejamos como estaba
        if (action.error.code?.startsWith('4')) endSession(state)
      })
      .addCase(updateMe.fulfilled, (state, action) => {
        state.user = action.payload
      })
      // El admin renombró o borró un interés: el usuario lo tiene guardado por nombre
      .addCase(updateInterest.fulfilled, (state, action) => {
        const { previousName, name } = action.payload
        if (state.user) state.user.interests = state.user.interests.map((interest) => (interest === previousName ? name : interest))
      })
      .addCase(deleteInterest.fulfilled, (state, action) => {
        if (state.user) state.user.interests = state.user.interests.filter((interest) => interest !== action.payload.name)
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

export const { logout, sessionExpired, openAuth, closeAuth } = authSlice.actions

export default authSlice.reducer

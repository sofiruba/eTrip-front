import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, listOf } from './api'
import { logout, sessionExpired, updateMe } from './authSlice'
import { replaceById, toUser } from './helpers'

/** Usuarios: la lista del panel de admin y los perfiles públicos (por ejemplo, el de un anfitrión). */

const URL = '/users'

// GET (admin): todos los usuarios
export const fetchUsers = createAsyncThunk('users/fetchUsers', async () => {
  const { data } = await api.get(URL)
  return listOf(data).map(toUser)
})

// GET /users/{id}: perfil público (queda guardado por id), con bio, ciudad, foto e intereses
export const fetchUserById = createAsyncThunk('users/fetchUserById', async (id) => {
  const { data } = await api.get(`${URL}/${id}`)
  return toUser(data)
})

// PATCH: solo el rol (CLIENTE / ADMIN)
export const updateUserRole = createAsyncThunk('users/updateUserRole', async ({ id, role }) => {
  const { data } = await api.patch(`${URL}/${id}/role`, null, { params: { role } })
  return toUser(data)
})

// PATCH: activar o desactivar la cuenta (baja lógica: el usuario sigue en la base, pero no puede ingresar)
export const updateUserStatus = createAsyncThunk('users/updateUserStatus', async ({ id, active }) => {
  const { data } = await api.patch(`${URL}/${id}/status`, null, { params: { active } })
  return toUser(data)
})

const initialState = {
  items: [], // panel de admin
  loading: false,
  loaded: false,
  error: null,
  profiles: {}, // { [id]: { item, loading, error, notFound } }
}

// Un usuario cambió: lo reemplazamos en la lista y en su perfil público, si estaba
function replaceUser(state, updated) {
  replaceById(state.items, updated)
  if (state.profiles[updated.id]?.item) state.profiles[updated.id].item = { ...state.profiles[updated.id].item, ...updated }
}

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false
        state.loaded = true
        state.items = action.payload
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })

      .addCase(fetchUserById.pending, (state, action) => {
        state.profiles[action.meta.arg] = { item: null, loading: true, error: null, notFound: false }
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.profiles[action.meta.arg] = { item: action.payload, loading: false, error: null, notFound: false }
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        const notFound = action.error.code === '404'
        state.profiles[action.meta.arg] = { item: null, loading: false, error: action.error.message, notFound }
      })

      .addCase(updateUserRole.fulfilled, (state, action) => replaceUser(state, action.payload))
      .addCase(updateUserStatus.fulfilled, (state, action) => replaceUser(state, action.payload))
      .addCase(updateMe.fulfilled, (state, action) => replaceUser(state, action.payload))

      // La lista completa es del admin: se olvida al cerrar sesión (los perfiles públicos quedan)
      .addCase(logout, (state) => {
        state.items = []
        state.loaded = false
      })
      .addCase(sessionExpired, (state) => {
        state.items = []
        state.loaded = false
      })
  },
})

export default usersSlice.reducer

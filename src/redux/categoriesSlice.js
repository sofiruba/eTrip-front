import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, listOf } from './api'
import { onlyOnce, removeById, replaceById } from './helpers'

/** Categorías de experiencias. Las lee todo el sitio (filtros, editor); las gestiona el admin. */

const URL = '/experience-categories'

// GET: una sola vez, al abrir la app
export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async () => {
    const { data } = await api.get(URL)
    return listOf(data)
  },
  onlyOnce((state) => state.categories),
)

// POST: category = { name, description }
export const createCategory = createAsyncThunk('categories/createCategory', async (newCategory) => {
  const { data } = await api.post(URL, newCategory)
  return data
})

// PUT: desestructuramos el id y mandamos el resto en el body
export const updateCategory = createAsyncThunk('categories/updateCategory', async ({ id, name, description }) => {
  const { data } = await api.put(`${URL}/${id}`, { name, description })
  return data
})

// DELETE: el back no devuelve nada; devolvemos el id para sacarla de la lista
export const deleteCategory = createAsyncThunk('categories/deleteCategory', async (id) => {
  await api.delete(`${URL}/${id}`)
  return id
})

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: {
    items: [],
    loading: false,
    loaded: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false
        state.loaded = true
        state.items = action.payload
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      // POST: me quedo con lo que había y agrego la nueva al final
      .addCase(createCategory.fulfilled, (state, action) => {
        state.items = [...state.items, action.payload]
      })
      // PUT: findIndex y reemplazo por la que devolvió el back
      .addCase(updateCategory.fulfilled, (state, action) => {
        replaceById(state.items, action.payload)
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        removeById(state.items, action.payload)
      })
  },
})

export default categoriesSlice.reducer

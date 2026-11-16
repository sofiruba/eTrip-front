import { createSlice } from '@reduxjs/toolkit'
import { deleteExperience } from './experiencesSlice'

/**
 * "Vistos recientemente": las últimas experiencias que se abrieron en este navegador.
 * Es estado solo de front (el back no lo necesita) y se guarda con redux-persist, igual que las preferencias.
 * Se guardan solo los ids: las tarjetas salen del catálogo que ya está en el store.
 */

const MAX_RECENT = 8

const recentlyViewedSlice = createSlice({
  name: 'recentlyViewed',
  initialState: {
    ids: [], // la más reciente primero
  },
  reducers: {
    // dispatch(addRecentlyViewed(experience.id)) al abrir el detalle. Si ya estaba, pasa a ser la primera
    addRecentlyViewed: (state, action) => {
      const id = action.payload
      state.ids = [id, ...state.ids.filter((entry) => entry !== id)].slice(0, MAX_RECENT)
    },
  },
  extraReducers: (builder) => {
    builder.addCase(deleteExperience.fulfilled, (state, action) => {
      state.ids = state.ids.filter((id) => id !== action.payload.id)
    })
  },
})

export const { addRecentlyViewed } = recentlyViewedSlice.actions

export default recentlyViewedSlice.reducer

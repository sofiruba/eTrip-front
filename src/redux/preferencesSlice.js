import { createSlice } from '@reduxjs/toolkit'

/**
 * Preferencias de este navegador. Son solo de front (no van al back), pero las usan varias pantallas,
 * así que viven en el estado global. Se guardan con redux-persist: siguen ahí al recargar.
 */

const MAX_RECENT_SEARCHES = 4

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState: {
    currency: 'ARS', // en qué moneda se VEN los precios (se cobran siempre en pesos)
    theme: null, // 'light' | 'dark' | null (sigue al sistema)
    recentSearches: [], // últimas búsquedas del buscador principal: { location, dateFrom, dateTo, adults, children, infants }
  },
  reducers: {
    setCurrency: (state, action) => {
      state.currency = action.payload
    },
    setTheme: (state, action) => {
      state.theme = action.payload
    },
    // La más nueva primero, sin repetir el mismo lugar
    addRecentSearch: (state, action) => {
      const search = action.payload
      if (!search.location) return
      const others = state.recentSearches.filter((entry) => entry.location.toLowerCase() !== search.location.toLowerCase())
      state.recentSearches = [search, ...others].slice(0, MAX_RECENT_SEARCHES)
    },
  },
})

export const { setCurrency, setTheme, addRecentSearch } = preferencesSlice.actions

export default preferencesSlice.reducer

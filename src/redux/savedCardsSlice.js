import { createSlice } from '@reduxjs/toolkit'

/**
 * Tarjetas guardadas, por usuario ({ [userId]: SavedCard[] }). Solo de front y persistidas con redux-persist.
 * Solo se guardan marca, últimos 4, vencimiento y titular (ver toSavedCard en utils/cards.js): nunca el número ni el CVV.
 */

const savedCardsSlice = createSlice({
  name: 'savedCards',
  initialState: {
    byUser: {},
  },
  reducers: {
    // payload = { userId, card }. Si ya estaba guardada, la actualiza y la pone primera
    saveCard: (state, action) => {
      const { userId, card } = action.payload
      const others = (state.byUser[userId] ?? []).filter((entry) => entry.id !== card.id)
      state.byUser[userId] = [card, ...others]
    },
    // payload = { userId, cardId }
    removeCard: (state, action) => {
      const { userId, cardId } = action.payload
      state.byUser[userId] = (state.byUser[userId] ?? []).filter((entry) => entry.id !== cardId)
    },
  },
})

export const { saveCard, removeCard } = savedCardsSlice.actions

export default savedCardsSlice.reducer

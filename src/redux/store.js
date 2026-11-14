import { configureStore } from '@reduxjs/toolkit'
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from 'redux-persist'
// Versión ES modules del storage (localStorage): la de `lib/` es CommonJS y Vite no le encuentra el `export default`
import storage from 'redux-persist/es/storage'
import { setupInterceptors } from './api'
import authReducer, { sessionExpired } from './authSlice'
import bookingsReducer from './bookingsSlice'
import cartReducer from './cartSlice'
import categoriesReducer from './categoriesSlice'
import couponsReducer from './couponsSlice'
import experiencesReducer from './experiencesSlice'
import importReducer from './importSlice'
import notificationsReducer from './notificationsSlice'
import ordersReducer from './ordersSlice'
import preferencesReducer from './preferencesSlice'
import reviewsReducer from './reviewsSlice'
import savedCardsReducer from './savedCardsSlice'
import sessionsReducer from './sessionsSlice'
import toastsReducer, { showToast } from './toastsSlice'
import usersReducer from './usersSlice'

/**
 * Persistencia con redux-persist (la librería de persistencia de Redux que vimos en clase).
 * Estos slices se guardan en el localStorage y se recuperan al recargar la página:
 *  - auth: el token, el usuario y lo que el back no guarda del perfil (no el modal de login, que se abre y se cierra)
 *  - preferences: moneda, tema y búsquedas recientes
 *  - savedCards: las tarjetas guardadas
 * El resto viene del back: se pide una sola vez al abrir la app (o la sección) y queda en el store.
 */
const persist = (key, reducer, whitelist) => persistReducer({ key, storage, whitelist }, reducer)

export const store = configureStore({
  // Un reducer por cada slice: cada uno maneja su parte del estado global (state.experiences, state.cart…)
  reducer: {
    // Datos que vienen del back: un slice por entidad
    experiences: experiencesReducer,
    sessions: sessionsReducer,
    categories: categoriesReducer,
    cart: cartReducer,
    orders: ordersReducer,
    bookings: bookingsReducer,
    reviews: reviewsReducer,
    coupons: couponsReducer,
    users: usersReducer,
    notifications: notificationsReducer,
    // Sesión (persistida)
    auth: persist('auth', authReducer, ['token', 'user', 'profileExtras']),
    // Solo de front
    preferences: persist('preferences', preferencesReducer),
    savedCards: persist('savedCards', savedCardsReducer),
    toasts: toastsReducer,
    dataImport: importReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // redux-persist despacha acciones con funciones adentro: le pedimos al chequeo de Redux que no las marque.
      // warnAfter: el catálogo trae las fotos en base64 y los chequeos de desarrollo tardan un poco más en recorrerlo
      serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER], warnAfter: 128 },
      immutableCheck: { warnAfter: 128 },
    }),
})

// Lee el localStorage y vuelve a cargar los slices persistidos (main.jsx espera con <PersistGate> antes de mostrar la app)
export const persistor = persistStore(store)

// axios lee el token del store en cada pedido. Si venció mientras se usaba la app, se cierra la sesión y se pide ingresar de nuevo
setupInterceptors(store, () => {
  store.dispatch(sessionExpired())
  store.dispatch(showToast('Tu sesión venció. Ingresá de nuevo para seguir.', 'info'))
})

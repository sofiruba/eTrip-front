# Tercera entrega: el front pasa a Redux

Hasta la segunda entrega el estado global vivía en Context (`src/context/`) y las llamadas al back estaban en `src/services/` con `fetch`.
Para la tercera entrega se migró todo a **Redux Toolkit**, siguiendo lo que se vio en clase (`Redux.pdf` y `Clase 14 - Redux.pdf`):

| | Segunda entrega | Tercera entrega |
|---|---|---|
| Estado global | 6 Context (`AuthProvider`, `CatalogProvider`, `CartProvider`…) | **Un store** (`configureStore`) con **un slice por entidad** |
| Llamadas al back | `services/*.js` con `fetch` + `.then/.catch` | **Acciones asíncronas** `createAsyncThunk` con **axios** y `async/await`, **sin try/catch** |
| Estados de la promesa | `useState` de `loading` y `error` en cada página | `extraReducers`: `pending` / `fulfilled` / `rejected` |
| Componentes | `useContext` (hooks `useAuth`, `useCart`, `useCatalog`…) | **`useSelector`** (suscribirse) + **`useDispatch`** (despachar acciones) |
| Después de un POST / PUT / PATCH / DELETE | Muchas pantallas volvían a pedir todo (`reload()`, `refreshSessions()`) | El reducer actualiza el store con la respuesta del back: **no se repite el GET** |
| Persistencia | `localStorage` a mano (`usePersistentState`) | **redux-persist** (token, usuario, preferencias, tarjetas) |

---

## 1. Cómo levantarlo

Igual que antes. Hay dependencias nuevas, así que hay que correr `npm install` una vez:

```bash
cd eTrip-front
npm install        # suma @reduxjs/toolkit, react-redux, axios y redux-persist
npm run dev        # http://localhost:5173
```

> **La primera vez hay que volver a iniciar sesión.** Antes el token se guardaba en `etrip:token` y las preferencias en
> `plan:*`; ahora los guarda redux-persist en `persist:auth`, `persist:preferences` y `persist:savedCards`.
> Los datos viejos del navegador (tema, moneda, tarjetas guardadas, bio/foto del perfil) no se migran.

Dependencias nuevas (`package.json`):

| Paquete | Versión | Para qué |
|---|---|---|
| `@reduxjs/toolkit` | ^2.13.0 | `configureStore`, `createSlice`, `createAsyncThunk` (trae Redux y el middleware Thunk) |
| `react-redux` | ^9.3.1 | `<Provider>`, `useSelector`, `useDispatch` |
| `axios` | ^1.21.0 | Pedidos HTTP (reemplaza a `fetch`) |
| `redux-persist` | ^6.0.0 | Guarda partes del store en el `localStorage` y las recupera al recargar |

---

## 2. Estructura nueva

```
src/redux/
  store.js              configureStore: un reducer por slice + redux-persist + interceptores de axios
  api.js                instancia de axios (URL base, token, errores del back)
  helpers.js            replaceById / upsertById / removeById (el findIndex de clase) e isMissing (¿falta pedir esta lista?)

  // Un slice por entidad del back
  experiencesSlice.js   experiencias (el "producto")
  sessionsSlice.js      fechas y cupos (el "stock")
  categoriesSlice.js    categorías
  cartSlice.js          carrito
  ordersSlice.js        órdenes (checkout)
  bookingsSlice.js      reservas / vouchers
  reviewsSlice.js       reseñas
  usersSlice.js         usuarios (panel de admin y perfiles públicos)
  couponsSlice.js       cupones
  notificationsSlice.js avisos
  authSlice.js          sesión: token, usuario, modal de login

  // Solo de front (no van a la base), pero los usan varias pantallas
  preferencesSlice.js   moneda, tema claro/oscuro, búsquedas recientes
  savedCardsSlice.js    tarjetas guardadas
  toastsSlice.js        avisos de abajo a la derecha
  importSlice.js        herramienta "Datos de prueba" del panel de admin
```

**Se borraron:** `src/context/` (los 6 providers y `AppProviders`), `src/services/` (los 13 servicios, que llamaban al back con `fetch`) y los hooks que envolvían
a los Context (`useAuth`, `useCart`, `useCatalog`, `useSavedCards`, `useToast`, `useFreshSessions`, `usePersistentState`,
`useRecentSearches`). `useCurrency` y `useTheme` siguen existiendo, pero ahora leen del store.

---

## 3. El flujo de Redux en eTrip

Es el dataflow de clase, con nuestros nombres:

```
  UI (componente)
   │  el usuario toca "Agregar al carrito"
   ▼
  dispatch(addToCart({ sessionId, quantity }))          ← useDispatch
   │
   ▼
  Middleware (Thunk) ─ createAsyncThunk ─► axios.post('/carts/items') ─► back (Spring)
   │                     pending  → reducer: loading = true
   │                     fulfilled → reducer: guarda el carrito que devolvió el back
   │                     rejected  → reducer: error = action.error.message
   ▼
  Store (estado global)
   │  state.cart cambió
   ▼
  Componentes suscriptos (useSelector) se vuelven a dibujar solos:
  el número del navbar, el carrito, el panel de reserva…
```

### 3.1 Store y Provider

`src/redux/store.js`:

```js
export const store = configureStore({
  reducer: {
    experiences: experiencesReducer,
    sessions: sessionsReducer,
    cart: cartReducer,
    // … un reducer por slice
    auth: persist('auth', authReducer, ['token', 'user', 'profileExtras']),
  },
})
```

`src/main.jsx`: el `<Provider>` va **por debajo de `StrictMode` y por arriba del router**, como en clase, así cualquier
componente de la app puede usar el store. `<PersistGate>` espera a que redux-persist recupere la sesión antes de dibujar.

```jsx
<StrictMode>
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <RouterProvider router={router} />
    </PersistGate>
  </Provider>
</StrictMode>
```

### 3.2 Un slice (lo mismo que `postSlice.js` de clase)

`src/redux/categoriesSlice.js` es el más chico y tiene GET, POST, PUT y DELETE (resumido; el archivo tiene cada caso en varias líneas):

```js
// GET: la acción se exporta a medida que se escribe; 'categories/fetchCategories' = endpoint/acción
export const fetchCategories = createAsyncThunk('categories/fetchCategories', async () => {
  const { data } = await api.get(URL)        // axios, sin try/catch
  return listOf(data)                        // esto es el payload
})

// POST: recibe el objeto nuevo y lo manda como segundo parámetro
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
  initialState: { items: [], loading: false, loaded: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchCategories.fulfilled, (state, action) => { state.loading = false; state.loaded = true; state.items = action.payload })
      .addCase(fetchCategories.rejected, (state, action) => { state.loading = false; state.error = action.error.message })
      .addCase(createCategory.fulfilled, (state, action) => { state.items = [...state.items, action.payload] })  // POST
      .addCase(updateCategory.fulfilled, (state, action) => replaceById(state.items, action.payload))         // PUT: findIndex
      .addCase(deleteCategory.fulfilled, (state, action) => removeById(state.items, action.payload))           // DELETE
  },
})

export default categoriesSlice.reducer
```

`replaceById` es exactamente el `findIndex` de clase (`helpers.js`):

```js
const index = list.findIndex((item) => item.id === updated.id)
if (index !== -1) list[index] = updated   // -1 = no estaba
```

**PATCH** se usa donde se manda solo el campo que cambia: descuento de una experiencia, pausar/activar una experiencia,
cambiar rol o activar/desactivar un usuario, cantidad de un ítem del carrito, marcar una notificación como leída.
Las **bajas lógicas** (lo que en clase se dijo "si es softDelete, es PATCH") son `updateExperienceStatus` y
`updateUserStatus`. Cancelar una fecha también es una baja lógica, pero el back la expone como `DELETE /experience-sessions/{id}`.

### 3.3 Un componente (lo mismo que `PostList` de clase)

`src/pages/MyBookingsPage.jsx`:

```jsx
const dispatch = useDispatch()
const { items: bookings, loaded, error } = useSelector((state) => state.bookings)  // suscripción

useEffect(() => {
  if (!loaded) dispatch(fetchBookings())   // solo si todavía no están en el store: así no se repite el GET
}, [loaded, dispatch])
```

Y para un POST/PUT desde un formulario (ej. `CategoryFormModal.jsx`). `dispatch` devuelve la acción final:
`fulfilled` (con `action.payload`) o `rejected` (con `action.error`, lo mismo que lee el reducer):

```jsx
const request = category ? dispatch(updateCategory({ id: category.id, ...data })) : dispatch(createCategory(data))
request.then((action) => {
  if (action.error) {                 // rejected: el back respondió con un error
    setError(action.error.message)    // se muestra en el modal
    return
  }
  dispatch(showToast({ message: 'Categoría creada' }))
  onClose()
})
```

La tabla del panel, los filtros del Home y el select del editor están suscriptos a `state.categories`:
se actualizan solos, sin GET.

---

## 4. Los slices, uno por uno

| Slice | Estado | Acciones asíncronas (método · endpoint) |
|---|---|---|
| **experiences** | `items` (catálogo público), `managed` (anfitrión: las suyas · admin: todas, también pausadas), `details[id]` (una experiencia con **todas** sus fotos), `searches[query]` (resultados de cada búsqueda con filtros) | `fetchExperiences` GET `/experiences` · `fetchMyExperiences` GET `/experiences/mine` (anfitrión) · `fetchAllExperiences` GET `?includeInactive=true` (admin) · `fetchExperienceById` GET `/experiences/{id}` · `searchExperiences` GET `/experiences?filtros` · `createExperience` POST · `updateExperience` PUT · `updateDiscount` PATCH `/{id}/discount` · `updateExperienceStatus` PATCH `/{id}/status` · `deleteExperience` DELETE |
| **sessions** | `items` (fechas públicas), `managed` (calendario, también pasadas y canceladas) | `fetchSessions` GET · `fetchManagedSessions` GET `/manage` · `createSession` POST · `updateSession` PUT · `cancelSession` DELETE `/{id}` · `removeSession` DELETE `/{id}/permanent` |
| **categories** | `items` | GET · POST · PUT · DELETE |
| **cart** | `items`, `total` | `fetchCart` GET `/carts/user/{id}` · `addToCart` POST `/carts/items` · `updateCartItem` PATCH · `removeCartItem` DELETE |
| **orders** | `items`, `stats` (admin), `details[id]` | `fetchOrders` GET · `fetchOrderStats` GET `/orders/stats` · `fetchOrderById` GET · `createOrder` POST `/orders` (checkout) · `cancelOrder` POST `/orders/{id}/cancel` |
| **bookings** | `items` (mías, o todas si es admin), `sales` (anfitrión), `details[id]` | `fetchBookings` GET · `fetchSales` GET `/bookings/sales` · `fetchBookingById` GET · `refundBooking` POST `/bookings/{id}/refund` |
| **reviews** | `items` (todas las que se fueron trayendo, sin repetir), `requested` | `fetchReviewsByExperience` · `fetchMyReviews` · `fetchAllReviews` (GET) · `createReview` POST · `replyToReview` PUT · `deleteReview` DELETE |
| **users** | `items` (admin), `profiles[id]` (públicos) | `fetchUsers` GET · `fetchUserById` GET · `updateUserRole` PATCH · `updateUserStatus` PATCH |
| **coupons** | `items` | `fetchCoupons` GET · `validateCoupon` GET `/validate` · `createCoupon` POST · `updateCoupon` PUT · `deleteCoupon` DELETE |
| **notifications** | `items` | `fetchNotifications` GET · `markNotificationRead` PATCH |
| **auth** | `token`, `user`, `profileExtras`, `authModal` | `login`, `register`, `resetPassword` (POST + GET `/users/me`) · `fetchMe` GET · `updateMe` PUT · `checkAvailability`, `requestPasswordReset`, `verifyResetCode`. Reducers comunes: `logout`, `sessionExpired`, `openAuth`, `closeAuth`, `updateProfileExtras` |
| **preferences** | `currency`, `theme`, `recentSearches` | (solo reducers) `setCurrency`, `setTheme`, `addRecentSearch` |
| **savedCards** | `byUser` | (solo reducers) `saveCard`, `removeCard` |
| **toasts** | `items` | (solo reducers) `showToast`, `hideToast` |
| **dataImport** | `log`, `running` | `importData` (usa los endpoints de siempre, uno por uno) |

> Sobre `details[id]`: los listados del back mandan **solo la foto de portada** y `GET /experiences/{id}` manda todas.
> Por eso el detalle y el editor piden la experiencia por id, **una vez por experiencia**: si se vuelve a entrar, ya está en el store.

---

## 5. "Un solo GET" (lo que se remarcó en clase)

> "Si no recargo la página, tengo que tener solo un GET […] ya que se hace una vez y queda guardado en el respectivo Store."

Cada slice guarda si su lista ya se trajo (`loaded`). Los componentes despachan el GET en su `useEffect` **solo si
todavía no está en el store**: `if (!loaded) dispatch(fetchBookings())`. Las páginas que piden varias listas usan
`isMissing(lista)` (`helpers.js`): no se trajo, no se está trayendo y no falló.

> **En desarrollo vas a ver el primer GET de cada lista dos veces** (en la pestaña Network y en Redux DevTools).
> No es un error: `<StrictMode>` monta cada componente, lo desmonta y lo vuelve a montar a propósito, así que el
> `useEffect` corre dos veces antes de que llegue la respuesta. Es lo que dice el apunte de la clase 10 sobre `useEffect`.
> En producción (`npm run build` + `npm run preview`, o el deploy) sale una sola vez. Navegar después no repite ningún GET.

| Cuándo | GET |
|---|---|
| Al abrir la app (`App.jsx`) | `/experiences`, `/experience-sessions`, `/experience-categories` |
| Al abrir la app con sesión guardada | `/users/me` (rol y contadores al día) |
| Al iniciar sesión | `/carts/user/{id}`, `/notifications` |
| Al entrar por primera vez a cada sección | lo que esa sección necesita (`/bookings`, `/experiences/mine`, `/orders`…) |
| Al abrir un detalle | `/experiences/{id}`, sus reseñas y su anfitrión, una vez por experiencia |
| Al buscar con filtros | `/experiences?…`, una vez por combinación de filtros (volver a una búsqueda ya hecha no repite el GET) |

Navegar entre el Home, el detalle, el carrito, Mis reservas o las pestañas del panel **no vuelve a pedir nada**.

**Se vuelve a pedir a propósito** (y está comentado en el código) solo en estos casos, porque el dato cambió en el back por
algo que el front no ve:

- **La campanita**, al abrirla: los avisos los generan otros usuarios (alguien compró, un anfitrión canceló).
- **Pago rechazado** en el checkout: lo que tenemos quedó viejo (por ejemplo, otra persona se llevó los últimos lugares);
  se vuelven a pedir carrito y fechas.
- **Carga de datos de prueba** del admin: se crean muchas cosas de una en el back.
- **Estadísticas del resumen del admin** después de un reembolso o una cancelación (las calcula el back).

### Actualizar el store sin volver a pedir (la respuesta del back alcanza)

Varios slices escuchan acciones de otros slices en sus `extraReducers`:

| Acción (cuando sale bien) | Qué hacen los reducers |
|---|---|
| `createOrder` (pagar) | **cart**: queda vacío · **sessions**: a cada fecha le resta los lugares comprados · **bookings**: suma las reservas nuevas · **orders**: guarda la orden (la pantalla de confirmación la lee sin GET) · **auth**: suma 1 al contador de compras |
| `refundBooking` | **bookings**: reemplaza la reserva · **sessions**: devuelve los lugares · **orders**: actualiza la orden (monto reembolsado, comisión y estado, con las mismas reglas del back) |
| `cancelOrder` (admin) | **orders**: reemplaza la orden · **bookings**: reemplaza sus reservas · **sessions**: devuelve los lugares de las reservas que se reembolsaron recién |
| `cancelSession` | **sessions**: queda cancelada en el calendario y sale del catálogo · **bookings / orders**: sus reservas quedan reembolsadas |
| `removeSession`, `deleteExperience` | se sacan de todas las listas (fechas, reservas y, si se borra una experiencia, sus reseñas) |
| `createExperience`, `updateExperience`, `updateDiscount`, `updateExperienceStatus` | **experiences**: catálogo, panel y detalle (una pausada sale del catálogo público) |
| `updateCategory` | **experiences**: cambia el nombre de la categoría en las experiencias |
| `createReview`, `deleteReview` | **reviews** · **experiences**: recalcula promedio y cantidad · **auth**: contador de reseñas |
| `logout`, `sessionExpired` | todo lo que era de esa cuenta (carrito, reservas, órdenes, panel, avisos…) vuelve a su estado inicial |

---

## 6. axios y los errores (`src/redux/api.js`)

- **Una instancia** con la URL base (`VITE_API_URL` o `http://localhost:4002`).
- **Interceptor de pedido:** lee el token del **estado global** (`store.getState().auth.token`) y lo agrega como
  `Authorization: Bearer …`. Si el token venció mientras se usaba la app, despacha `sessionExpired` (se cierra la sesión,
  se abre el login y aparece un aviso). `store.js` conecta el interceptor después de crear el store, así no hay import circular.
- **Interceptor de respuesta:** si el back responde con error, lo convierte en un `Error` con el mensaje que manda el back
  (`{ message }`) y el status HTTP en `code`. Por eso en los thunks **no hay try/catch**: `createAsyncThunk` atrapa el
  error y el reducer hace `state.error = action.error.message`, como en clase.
- axios ya transforma el JSON (no hace falta `response.json()`), y las fotos van como `FormData`.

---

## 7. Persistencia con redux-persist

> "Si usamos esto, le decimos adiós a local storage, tal que la librería de persistencia trabaja por detrás con el local Storage."

| Se guarda | Por qué |
|---|---|
| `auth`: `token`, `user`, `profileExtras` | La sesión sigue abierta al recargar. `profileExtras` = bio, ciudad, intereses y foto (el back no los guarda) |
| `preferences` | Moneda, tema y búsquedas recientes son solo de front |
| `savedCards` | Tarjetas guardadas (marca, últimos 4, vencimiento y titular; nunca el número ni el CVV) |

No se guarda nada que venga del back (catálogo, carrito, reservas): eso se pide una vez al abrir la app.
`index.html` lee `persist:preferences` antes de pintar para aplicar el tema sin parpadeo.

Detalle técnico: el storage se importa desde `redux-persist/es/storage` (versión ES modules). La de `lib/` es CommonJS
y Vite 8 no le encuentra el `export default` (la app quedaba en blanco).

---

## 8. Qué quedó como estado local (y por qué)

Redux no reemplaza al estado local: se complementan. Siguen con `useState` las cosas que usa **un solo componente**:
los formularios mientras se escriben (formularios controlados), qué modal está abierto, el cupón aplicado en el checkout,
la pestaña elegida, los pasos del registro. Los filtros del catálogo siguen en la URL para que una búsqueda se pueda compartir.

---

## 9. Solo lo que se vio en clase

El 15/11 se sacaron las herramientas de Redux Toolkit que no se dieron en clase (`condition`, `unwrap`, `createSelector`,
`prepare`, `addMatcher`/`isAnyOf` y `getState` en los thunks). **No cambió nada visual ni de funcionamiento**; se
reemplazaron por la forma de clase:

| Antes | Ahora |
|---|---|
| `condition` en el thunk para no repetir el GET | `if (!loaded) dispatch(fetchX())` en el `useEffect` del componente |
| `dispatch(x).unwrap().then().catch()` | `dispatch(x).then((action) => { if (action.error) … })`: `action.error.message` es lo mismo que lee el reducer |
| `createSelector` (catálogo + fechas) | Se calcula en el componente con `addSessionInfo(items, sessions)` |
| `prepare` en `showToast` / `openAuth` | Se despachan con un objeto: `showToast({ message, tone })`, `openAuth({ mode, redirect })` |
| `addMatcher(isAnyOf(logout, sessionExpired))` | Dos `addCase`: `.addCase(logout, …).addCase(sessionExpired, …)` |
| `getState()` dentro de thunks | Lo que necesitan llega por parámetro: `fetchCart(userId)`, `cancelOrder(order)`; el GET del anfitrión y el del admin son dos acciones (`fetchMyExperiences`, `fetchAllExperiences`) |

Lo único que no se vio tal cual en clase y **se mantiene** (porque sin eso se pierde funcionalidad):

| Qué | Por qué se queda |
|---|---|
| **Interceptores de axios** (`api.js`) | Es configuración de axios, no de Redux. Agregan el token del store a cada pedido y hacen que el error tenga el mensaje del back ("Usuario o contraseña incorrectos", "El banco rechazó la tarjeta"). Sin ellos, `action.error.message` diría "Request failed with status code 400" |
| **Slices que escuchan acciones de otros slices** | Es el mismo `addCase` de `extraReducers` de clase, con una acción de otro slice. Es lo que hace que, al pagar, los cupos bajen y el carrito se vacíe sin volver a pedir nada |

---

## 10. Cambios archivo por archivo

**Nuevos**
- `src/redux/*` (los 18 archivos de la sección 2).
- `src/components/layout/Toaster.jsx` (+ `Toaster.css`, que antes era `src/context/Toast.css`): dibuja los avisos del slice `toasts` y los saca solos a los 3 segundos.
- `REDUX-TERCERA-ENTREGA.md` (este archivo).

**Borrados**
- `src/context/AppProviders.jsx`, `AuthProvider.jsx`, `CartProvider.jsx`, `CatalogProvider.jsx`, `CurrencyProvider.jsx`, `SavedCardsProvider.jsx`, `ToastProvider.jsx`.
- `src/services/api.js`, `authService.js`, `bookingsService.js`, `cartService.js`, `categoriesService.js`, `couponsService.js`, `experiencesService.js`, `importService.js`, `notificationsService.js`, `ordersService.js`, `reviewsService.js`, `sessionsService.js`, `usersService.js`.
- `src/hooks/useAuth.js`, `useCart.js`, `useCatalog.js`, `useSavedCards.js`, `useToast.js`, `useFreshSessions.js`, `usePersistentState.js`, `useRecentSearches.js`.

**Modificados**

| Archivo | Cambio |
|---|---|
| `package.json` | Dependencias nuevas |
| `index.html` | El script del tema lee `persist:preferences` |
| `README.md` | Tecnologías y estructura nueva |
| `src/main.jsx` | `<Provider store>` + `<PersistGate>`; se va `AppProviders` |
| `src/App.jsx` | Los GET del arranque (catálogo, `/users/me`, carrito y avisos) con `useEffect` + `dispatch` |
| `src/hooks/useCurrency.js`, `useTheme.js` | Leen la moneda y el tema del store; los cambios se despachan |
| `src/utils/experienceForm.js` | `toFile` convierte la foto base64 en archivo sin `fetch` |
| `src/routes/RequireAuth.jsx`, `CustomerOnly.jsx` | `useSelector` para el usuario y el rol |
| `src/pages/HomePage.jsx` | Catálogo del store; búsquedas con filtros guardadas por query; ya no vuelve a pedir el catálogo en cada visita |
| `src/pages/ExperiencePage.jsx` | Detalle desde `details[id]`, reseñas y anfitrión del store; fechas del catálogo; responder reseñas con `replyToReview` |
| `src/pages/CartPage.jsx`, `CheckoutPage.jsx` | Carrito y fechas del store; `updateCartItem`, `removeCartItem`, `validateCoupon`, `createOrder`; si el pago se rechaza se vuelven a pedir carrito y fechas; esperan a que llegue el carrito si se recarga la página |
| `src/pages/CheckoutSuccessPage.jsx` | La orden recién comprada sale del store (solo se pide si se recarga) |
| `src/pages/MyBookingsPage.jsx`, `BookingDetailPage.jsx` | Reservas, orden y reseñas del store; el reembolso y la reseña nueva actualizan la página solos |
| `src/pages/ExperienceEditorPage.jsx` | Se separó en la página (trae la experiencia) y `ExperienceForm` (el formulario arranca con sus datos). POST / PUT / PATCH con thunks |
| `src/pages/HostPage.jsx` | Datos del modo anfitrión del store; las pestañas ya no reciben funciones `setX` |
| `src/pages/HostProfilePage.jsx` | Perfil con `fetchUserById`; sus experiencias salen del catálogo (sin otro GET) |
| `src/pages/ProfilePage.jsx` | Reseñas del store; contadores del usuario del store (los reducers los mantienen al día) |
| `src/components/admin/*` | Cada sección despacha sus GET (una vez) y sus acciones; muestran error y "Reintentar" si el back falla |
| `src/components/host/*` | `DiscountModal`, `SessionFormModal`, `HostCalendar`, `HostBookings`, `HostExperiences` despachan sus acciones y dejan de recibir `onSaved` / `setX` |
| `src/components/auth/*` | Login, registro y recuperar contraseña con thunks; el resultado se lee de la acción (`action.error` / `action.payload`); el modal lee `state.auth.authModal` |
| `src/components/booking/RefundModal.jsx`, `ReviewFormModal.jsx` | `refundBooking` y `createReview` |
| `src/components/layout/*` | Navbar, menú de usuario, campanita, moneda y layout con `useSelector` / `useDispatch`; el layout dibuja `<Toaster />` |
| `src/components/experience/BookingPanel.jsx` | `addToCart`; cuántos lugares ya están en el carrito sale del store |
| `src/components/profile/*`, `search/*`, `editor/CityField.jsx`, `home/HostInvite.jsx` | Leen del store / despachan en vez de usar los Context |

### Mejoras que salieron en el camino

- **Menos pedidos al back:** el Home ya no vuelve a pedir el catálogo en cada visita; el carrito y el checkout ya no
  vuelven a pedir las fechas al entrar; después de comprar, reembolsar, publicar o editar no se recarga nada.
- **Borrar un cupón:** antes se volvía a pedir toda la lista para saber si el back lo había borrado o desactivado; ahora el
  reducer aplica la misma regla del back (si ya se usó, queda inactivo).
- **Quitar un ítem del carrito:** antes se volvía a pedir el carrito para tener el total; ahora el reducer lo recalcula.
- **Login:** muestra el mensaje del back (por ejemplo, "Tu cuenta está desactivada…") en vez de uno genérico.
- **Errores visibles:** las secciones del panel, el modo anfitrión y el detalle muestran el error y "Reintentar" cuando
  el back falla, en vez de quedar vacías.
- **Recargar en `/checkout`:** espera a que llegue el carrito en vez de mostrar "No hay nada para pagar".

---

## 11. Cómo se probó

- `npm run lint` (oxlint) sin errores ni advertencias, y `npm run build` sin errores.
- Recorridos automáticos con un navegador (Edge) contra el back real, levantado con los datos de ejemplo del seed en
  **una base temporal aparte** (`etrip_redux_test`, que después se borró; la base `etrip_db` no se tocó).
  En cada paso se contaron los pedidos al back y se revisó que no hubiera errores ni advertencias en la consola:
  - **Visitante:** el Home hace 3 GET y nada más; detalle con todas las fotos; volver al Home o al mismo detalle no repite pedidos; un filtro hace un GET y volver a él no lo repite.
  - **Compradora:** login (token persistido), agregar al carrito (1 POST, el navbar se actualiza solo), carrito sin pedidos, pagar (**1 POST y ningún GET**: el carrito queda vacío y los lugares de la fecha bajan solos), Mis reservas, reembolso (1 POST), perfil, recargar (la sesión sigue), tema persistido, logout (todo vuelve al estado inicial).
  - **Anfitrión:** modo anfitrión (3 GET, cambiar de pestaña no repite), descuento (PATCH), fecha nueva (POST), editarla (PUT), cancelarla (DELETE, queda en el historial), borrarla (DELETE permanente), crear una experiencia con foto (POST), editarla (PUT), cambiarle las fotos y borrarla (DELETE).
  - **Admin:** el resumen pide cada lista una sola vez y recorrer las 9 secciones no repite ningún GET; categorías (POST/PUT/DELETE), cupones (crear, borrar uno sin usar, desactivar uno usado), pausar una experiencia (sale del catálogo público sin GET), cancelar una orden, borrar una reseña, desactivar y activar un usuario, carga de datos de prueba.
  - **Otros:** registro en 3 pasos, recuperar contraseña con el código de la consola, login con datos incorrectos, cupón en el checkout, tarjeta rechazada (se sincronizan carrito y fechas), notificaciones (abrir y marcar leída), respuesta del anfitrión a una reseña, escribir y borrar una reseña.
  - Los recorridos de visitante y compradora se repitieron con el **build de producción** (`vite preview`).

---

## 12. Para la defensa: preguntas probables

**¿Dónde está el store y cómo llega a los componentes?**
En `src/redux/store.js` (`configureStore` con un reducer por slice). `main.jsx` envuelve la app con `<Provider store={store}>`, por debajo de `StrictMode` y por arriba del router.

**¿Qué es un slice?**
Todo lo de una entidad junto: sus acciones asíncronas (GET, POST, PUT, PATCH, DELETE) y su `createSlice` con el estado inicial, `reducers` (cambios síncronos) y `extraReducers` (los tres estados de cada promesa). Ej.: `experiencesSlice.js`.

**¿Dónde se hacen las llamadas al back?**
Solo en los slices, con `createAsyncThunk` + axios. Los componentes solo despachan acciones (`useDispatch`) y se suscriben a una parte del estado (`useSelector`).

**¿Por qué no hay try/catch?**
Porque `createAsyncThunk` maneja la promesa: si axios falla, la acción queda `rejected` y el reducer guarda `action.error.message`. El interceptor de `api.js` hace que ese mensaje sea el que manda el back.

**¿Cómo evitan pedir dos veces lo mismo?**
Cada componente pide la lista en su `useEffect` solo si todavía no está en el store (`if (!loaded)`). Y después de un POST/PUT/PATCH/DELETE el reducer actualiza el store con la respuesta del back (`push`, `findIndex` + reemplazo, `filter`), así que no hace falta volver a pedir.

**Si compro, ¿cómo se entera el catálogo de que hay menos lugares?**
`createOrder` devuelve la orden con sus reservas. El reducer de `sessionsSlice` escucha `createOrder.fulfilled` y le resta a cada fecha los lugares comprados. El detalle, el carrito y el Home están suscriptos a `state.sessions` y se vuelven a dibujar solos.

**¿Dónde está el token?**
En el estado global (`state.auth.token`). axios lo lee en cada pedido con un interceptor, y redux-persist lo guarda para que la sesión siga al recargar.

**¿Por qué el carrito está en Redux si vive en el back?**
Porque lo usan varias pantallas a la vez (navbar, detalle, carrito, checkout). El back es la fuente de verdad (valida el stock al pagar) y el store tiene la copia que se muestra.

**¿Qué sigue usando estado local?**
Lo que es de un solo componente: formularios mientras se escriben, modales abiertos, el cupón aplicado en el checkout, la pestaña elegida.

---

## 13. Pendientes y notas

- **Recuperar contraseña:** sigue mostrando el código por consola (`devCode`), como estaba. Mandar el mail de verdad
  es un cambio del **back** (y necesita una cuenta de correo); no se tocó.
- **Rendimiento (15/11):** el panel de admin, el modo anfitrión y el editor se descargan recién cuando alguien entra (como el checkout). La primera carga bajó de 685 kB a 393 kB y el build ya no avisa nada.
- `npm audit` marca 2 vulnerabilidades en dependencias **de desarrollo** (`vite` 8.3.0 y `source-map-js`) que ya estaban
  antes de este cambio; se arreglan con `npm audit fix`. Las dependencias de producción no tienen ninguna.

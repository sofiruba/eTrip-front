# Análisis para la entrega final (24/11)

Revisión de todo el código contra:

1. la **consigna del TP** (`API TPO - 2° cuatrimestre 2026.pdf`),
2. lo que se vio de **Redux en clase** (`Redux.pdf` y `Clase 14 - Redux.pdf`),
3. la entrega final como **venta del producto**,
4. la lista vieja de pendientes (`CONTEXTO-MEJORAS.md`, de la 2da entrega), ahora que todo está en Redux.

Cada idea dice cuánto lleva (**S** = un par de horas · **M** = medio día · **L** = un día o más) y si necesita el **back**.
Lo que ya se aplicó está marcado con ✅.

> **Estado al 16/11:** se hizo casi todo lo de este análisis (ver la sección 14 de `REDUX-TERCERA-ENTREGA.md`).
> Decisiones tomadas: **no** hay registro como vendedor (en PLAN toda cuenta compra y vende), **no** se hace deploy,
> **no** hay tests de front y la paginación queda como está. Lo que sigue abierto está en la sección 6.

---

## 0. Resumen

**El estado general es bueno.** Todos los puntos de la consigna funcionan y Redux quedó **solo con lo que se vio en clase**
(ver 2). Lo que queda son detalles que un corrector podría marcar y cosas para que la presentación venda mejor.

| # | Qué | Por qué importa | Esfuerzo | ¿Back? |
|---|---|---|---|---|
| 1 | ~~Registro como vendedor explícito~~ | **Decidido: no.** En PLAN toda cuenta compra y vende; se defiende así | — | — |
| 2 | **Búsqueda por texto** ✅ | "kayak" ahora se manda como `title` si no es una ciudad | S | No |
| 3 | **Los intereses no se usan** ✅ | Ahora son **tags** de las experiencias (back) y arman "Para vos" en el Home | M | Sí |
| 4 | **El anfitrión no puede pausar su experiencia** ✅ | Botón Pausar / Publicar de nuevo en Mis experiencias | S | No |
| 5 | **Textos que no son ciertos** ✅ | Los favoritos volvieron (guardados en el back) y "dar de baja" dice exactamente qué pasa (reembolso y aviso a todos) | S | No |
| 6 | **Perfil del anfitrión vacío** ✅ | Bio, ciudad, foto e intereses viven en el back y se ven en el perfil público y en el detalle | L | Sí |
| 7 | **Ensayar la defensa con Redux DevTools** | Es lo que se evalúa en esta entrega | S | No |

---

## 1. Consigna vs. lo que hay

✅ = cumple · ⚠️ = cumple, pero un corrector podría marcarlo

| Requisito | Estado | Dónde se ve / qué falta |
|---|---|---|
| Registro de usuarios **como compradores y vendedores** (usuario, mail, contraseña, nombre y apellido) | ✅ | Pide todos los datos. **Regla de PLAN:** toda cuenta compra y vende (el back solo tiene `CLIENTE` y `ADMIN`); el modo anfitrión está para cualquiera |
| Login con usuario y contraseña | ✅ | Con email o usuario |
| Administración de cuentas y permisos | ✅ | Panel → Usuarios: hacer/quitar admin, activar/desactivar |
| Productos con foto y precio | ✅ | Tarjetas del Home |
| Búsqueda y filtrado por categoría, precio, etc. | ✅ | Filtros completos, búsqueda por texto y por intereses (`tags`) |
| Detalle con imagen y descripción | ✅ | Galería con todas las fotos, descripción, mapa, anfitrión, reseñas |
| Agregar al carrito | ✅ | Panel de reserva |
| Sin stock: indicado y no se puede agregar | ✅ | "Agotada" en la tarjeta y en cada fecha; botón deshabilitado |
| Carrito: agregar, eliminar, modificar | ✅ | POST, DELETE, PATCH |
| Checkout con total automático | ✅ | Total, descuentos y cupón (lo calcula el back) |
| Descontar y validar stock al comprar | ✅ | El back valida y descuenta; el store baja los cupos con la respuesta |
| Vendedor publica con una o más fotos, descripción, categoría y precio | ✅ | Editor de experiencias |
| El creador maneja el stock | ✅ | Calendario: cupo de cada fecha |
| El creador elimina el producto | ✅ | "Dar de baja": se cancelan sus fechas, **todas las reservas vigentes se reembolsan y cada persona recibe un aviso**; si alguna vez se vendió queda como `DELETED` (solo para el admin). Además puede **pausarla** |
| Descuentos sobre productos individuales | ✅ | Modal de descuento (PATCH) |
| API REST, persistencia, interfaz dinámica | ✅ | |

---

## 2. Redux: lo de clase

### 2.1 Lo que se sacó el 15/11 ✅

Se sacaron todas las herramientas de Redux Toolkit que **no se vieron en clase**. **No cambió nada visual ni de
funcionamiento** (se probó todo de nuevo de punta a punta):

| Se sacó | Se reemplazó por (lo de clase) |
|---|---|
| `condition` (no repetir el GET) | `if (!loaded) dispatch(fetchX())` en el `useEffect` |
| `.unwrap()` | `dispatch(x).then((action) => { if (action.error) … })`: `action.error.message`, igual que en el reducer |
| `createSelector` | El cálculo (catálogo + fechas) se hace en el componente |
| `prepare` | `showToast({ message, tone })`, `openAuth({ mode, redirect })` |
| `addMatcher` + `isAnyOf` | Dos `addCase` (`logout` y `sessionExpired`) |
| `getState` en los thunks | Los datos llegan por parámetro (`fetchCart(userId)`, `cancelOrder(order)`) |

**Lo único que no está tal cual en clase y se mantiene** (si se saca, se pierde funcionalidad):
- **Interceptores de axios** (`api.js`): es configuración de axios, no de Redux. Ponen el token del store en cada pedido
  y hacen que el error traiga el mensaje del back. Sin eso, los errores dirían "Request failed with status code 400".
- **Slices que escuchan acciones de otros slices**: es el mismo `addCase` de clase. Es lo que hace que al pagar bajen
  los cupos y se vacíe el carrito sin otro GET.

> **Ojo con una cosa que ahora se ve:** en desarrollo (`npm run dev`) el primer GET de cada lista aparece **dos veces**
> en Network y en Redux DevTools. Es `<StrictMode>`, que monta cada componente dos veces a propósito (está en el apunte
> de la clase 10). En producción sale una sola vez, y navegar después no repite nada. Opciones para la presentación:
> **(a)** explicarlo si la profe pregunta, **(b)** presentar con el build de producción (`npm run build` y `npm run preview`).

### 2.2 Lo de clase que sí está

| Concepto de clase | Dónde |
|---|---|
| Store con `configureStore` y un reducer por slice | `src/redux/store.js` |
| `<Provider>` debajo de `StrictMode` y arriba del router | `src/main.jsx` |
| Un slice por entidad de la base | experiencias, fechas, categorías, carrito, órdenes, reservas, reseñas, usuarios, cupones, avisos, sesión |
| `{ items, error, loading }` + pending / fulfilled / rejected | Todos los slices |
| `createAsyncThunk` + axios + `async/await`, sin try/catch | Todos los thunks |
| POST con push/spread · PUT con `findIndex` · PATCH parcial · baja lógica = PATCH · DELETE con filter | `categoriesSlice.js` es el ejemplo completo |
| `useSelector` + `useDispatch` + `useEffect([dispatch])` | Todas las páginas |
| Llamadas al back solo dentro de Redux | Ningún componente importa axios |
| Un solo GET por lista | `if (!loaded)` en los efectos (comprobado navegando toda la app) |
| Token en el estado global | `state.auth.token` |
| Estado solo de front en Redux | Moneda, tema, búsquedas recientes, tarjetas, avisos |
| Persistencia ("adiós localStorage") | redux-persist |

### 2.3 Lo de clase que no está (y no hace falta)

**Paginación.** Es traer una lista **en partes** (por ejemplo, de a 20) en vez de toda junta. En clase se mencionó
como ejemplo de Redux: guardar cada página que llega (con spread) y, si se vuelve a una que ya está, no pedirla de nuevo.
Nosotros traemos todo de una vez porque son pocos datos (43 experiencias), y el botón "Ver más" del Home solo muestra
8 más de lo que ya está cargado. **No cambia nada visual.** Solo tendría sentido con miles de datos.
**Recomendación: no hacerla.** Si la profe pregunta: "el back ya acepta `page` y `size`; como son pocos datos, se piden
una vez y se paginan en el front".

**Filtros en Redux.** En clase se dieron como ejemplo de estado de front. Los nuestros van en la **URL** (así el link se
puede compartir) y los resuelve el back; los resultados de cada búsqueda sí quedan en Redux. **No cambiarlo.**

**Redux DevTools.** Ya funciona (lo trae `configureStore`). **Usarlo en la demo** (ver 4.4).

**Carpeta `Redux`.** La profe usó `src/Redux`; la nuestra es `src/redux`. Si es estricta con eso, renombrarla es un
minuto (en Windows con `git mv` en dos pasos).

### 2.4 Detalles técnicos opcionales

| Detalle | Propuesta | Esfuerzo |
|---|---|---|
| redux-persist sin `version` | Agregar `version: 1`: si cambia la forma del estado guardado, se puede migrar | S |
| Cupos que cambian otros usuarios | Se piden una vez: si otra persona compra, se ve al recargar. El back valida al pagar y el front se resincroniza si rechaza (probado). Si en la demo se compra desde dos navegadores, saber explicarlo | — |

---

## 3. Problemas encontrados en el código

### 3.1 Búsqueda por texto (front, S) ✅

`HeroSearch.jsx` sugiere experiencias por título mientras se escribe, pero al apretar Enter el texto se manda como
`location`: "kayak" → "Todavía no hay planes en kayak". El back ya filtra por `title` y el front ya lee `title` de la URL.
**Propuesta:** si el texto no es una ciudad conocida, mandarlo como `title`.

### 3.2 Intereses que no se usan ✅ (hecho con tags en el back)

Se eligen al registrarse ("te mostramos planes para vos") pero solo se muestran en el perfil. Opciones:
- **Sección "Para vos" en el Home:** tabla interés → categoría (Cocina, Café, Gastronomía → Gastronomía; Caminata,
  Camping → Aventura…) y/o buscar el interés en el título. Todo con lo que ya está en el store.
- **Mínimo:** cambiar el texto del registro.

### 3.3 Registro de vendedores — descartado

En PLAN toda cuenta compra y vende: no se agrega ninguna opción al registro.

### 3.4 El anfitrión no puede pausar su experiencia (front, S) ✅

- El back **no deja borrar** una experiencia que alguna vez tuvo reservas, y responde: "…Podés desactivarla para que no
  se vea más en el catálogo".
- El back **sí deja** que el dueño la pause (`PATCH /experiences/{id}/status`), y la acción ya existe en Redux
  (`updateExperienceStatus`, la usa el admin). Pero **Mis experiencias no tiene el botón**: el anfitrión lee "desactivala"
  y no puede. Agregar "Pausar / Activar" en cada tarjeta es reutilizar lo que ya está.

### 3.5 Textos que no son ciertos (front, S) ✅

- `AuthModal.jsx`: "Creá tu cuenta para **guardar** y reservar experiencias" (los favoritos se sacaron en `cb4d2af`).
- `HostExperiences.jsx` y `ExperiencesAdmin.jsx`: "se elimina junto con sus fechas, **sus reservas pasadas** y sus reseñas".
  En realidad el back no deja borrar si tuvo reservas. Y `HostExperiences` solo avisa antes si hay reservas **próximas**:
  con reservas pasadas deja intentarlo y el back rechaza. Cambiar el texto y el chequeo.

### 3.6 Perfil del anfitrión vacío (back, L) ✅

Bio, ciudad, foto e intereses se guardan en el navegador del dueño (`profileExtras`), porque el back no tiene esos
campos. El perfil público de cualquier anfitrión (y la tarjeta del anfitrión en el detalle) sale con el texto genérico
y las iniciales, **incluso para el propio anfitrión**. Para un marketplace de experiencias es lo que más se nota.
Requiere agregar `bio`, `city`, `avatar` e `interests` al usuario en el back.

### 3.7 Deploy: qué es y si hay que hacerlo

**Deploy** = subir la app a internet para que tenga una dirección pública (por ejemplo, `plan.vercel.app`): el front
en **Vercel** y el back en **Render** (lo mencionaron en la teoría). **La consigna no lo pide.** Si la presentación es
en la compu con `npm run dev` y el back levantado, no hace falta nada.

Si deciden hacerlo: en el front falta un archivo `vercel.json` (si no, recargar `/experiencias/5` da 404) y cargar
`VITE_API_URL`; el back necesita la configuración de Render, una base MySQL en la nube y sumar la URL de Vercel a CORS.
Es lo más largo de todo (L). **Preguntarle a la profe** si lo espera.

### 3.8 Rendimiento ✅

El panel de admin, el modo anfitrión y el editor ahora se descargan recién cuando alguien entra (como ya pasaba con el
checkout). La primera carga bajó de **685 kB a 393 kB** y el build ya no muestra la advertencia.

### 3.9 Tests

Decidido: no se hacen en el front.

### 3.10 Otros

- **Recuperar contraseña:** el código sigue saliendo por consola (`devCode`). Mandar mails es un cambio del back. Preguntarle a la profe si alcanza.
- **"Datos de prueba" en el panel de admin:** ✅ solo se muestra en desarrollo (`import.meta.env.DEV`).
- **Fotos en base64:** el listado ya manda solo la portada (bien). Guardar archivos con URL sería lo profesional, pero no hace falta.
- **`npm audit`:** 2 avisos en dependencias de desarrollo (`vite`, `source-map-js`); se arreglan con `npm audit fix`.

---

## 4. Ideas para la entrega final (pensando en vender PLAN)

### 4.0 Qué diferencia a PLAN hoy (ya está hecho)

- **Planes con gente local**, en tu ciudad o en la que visitás (9 ciudades en los datos de ejemplo): el producto es una fecha con cupo.
- **Buscador pensado para planes:** destino con "cerca mío", fechas con los días disponibles marcados, atajos
  ("Este finde"), viajeros por edad (con niños se ocultan las experiencias solo +18), duración, horario, precio, ofertas.
- **Urgencia y transparencia:** "¡Quedan pocos!", agotadas, precio en tu moneda, ahorro visible, protección si el precio cambia mientras pagás.
- **Compra completa:** avisos de cupo antes de pagar, cupones, tarjetas guardadas (sin el número), vouchers, comprobante,
  **cancelación hasta 48 h antes**.
- **Reseñas confiables:** solo reseña quien fue y cuando terminó; el anfitrión responde en público.
- **Herramientas para el anfitrión:** ganancias netas (comisión del 10 % a la vista), calendario con ocupación, huéspedes, descuentos.
- **Panel de administración con alertas** ("requiere atención").
- **Modelo de negocio claro:** 10 % de comisión + cupones.

### 4.1 Registro de vendedores — descartado · Página "Ser anfitrión" — idea abierta

El registro no cambia (toda cuenta compra y vende). Sigue siendo buena idea una **página pública `/ser-anfitrion`**
(qué es, cómo funciona en 3 pasos, calculadora de ganancias: precio × personas × fechas − 10 %) para que el link
"Ser anfitrión" del navbar no lleve a un muro de login. Esfuerzo S-M, solo front.

### 4.2 Ideas solo de front

| Idea | Qué aporta | Esfuerzo |
|---|---|---|
| **Pausar / activar** en Mis experiencias (3.4) ✅ | Completa la gestión del producto | S |
| **"Para vos"** según intereses (3.2) ✅ | Cumple lo que promete el registro | M |
| **Vistos recientemente** como slice de Redux persistido ✅ | Es el ejemplo de clase de estado solo de front en Redux | S-M |
| **Anfitrión destacado** (promedio ≥ 4,7 con al menos 5 reseñas) ✅ | Confianza; sale del store | S |
| **Números de PLAN en el Home** ✅ | Prueba social | S |
| **"Agregar a mi calendario"** en el voucher ✅ (+ Google Calendar) | Detalle de producto muy visible | S |
| **Compartir por WhatsApp** ✅ (detalle y voucher) | Los planes se deciden en grupo | S |
| **Meta tags para compartir** ✅ | El link se ve lindo en WhatsApp | S |
| **Favoritos** ✅ (en el back, no solo persistidos: se ven desde cualquier dispositivo) | "Guardados" en el menú | M |

### 4.3 Ideas que necesitan el back

| Idea | Qué aporta | Esfuerzo |
|---|---|---|
| **Perfil del anfitrión en el back** (3.6) ✅ | El anfitrión es el producto | L |
| **Lista de espera** en fechas agotadas ✅ (avisa a todos cuando se libera un lugar) | Diferencial claro | L |
| **Regalar una experiencia** ✅ (la destinataria la ve en sus reservas) | Caso de uso fuerte para vender | L |
| **Dar de baja con reembolso y aviso a todos** ✅ | Regla de PLAN | L |
| **Mails reales** (recuperar contraseña, confirmación de compra) | Producto "de verdad" | M-L |
| ~~Deploy~~ (3.7) | Decidido: no hace falta | — |

### 4.5 Más ideas para la entrega final (abiertas)

| Idea | Qué aporta | Esfuerzo | ¿Back? |
|---|---|---|---|
| **Página "Ser anfitrión"** con calculadora de ganancias (4.1) | Vende el lado del vendedor | S-M | No |
| **Reseñas con foto del autor** (`userAvatarBase64` en `ReviewResponseDTO`) | Ahora que la foto está en el back, las reseñas pueden mostrarla | S | Sí |
| **"Planes de tus anfitriones favoritos"**: guardar anfitriones, no solo experiencias | Fideliza | M | Sí |
| **Cupón de bienvenida automático** al registrarse (hoy BIENVENIDA15 existe pero hay que saberlo) | Conversión | S | Sí |
| **Recordatorio 24 h antes** (notificación generada por el back con una tarea programada) | Usa los avisos que ya existen | M | Sí |
| **Reseñas paginadas** en el detalle (`GET /reviews/experience/{id}?page=`), acumulando con spread como se vio en clase | Es *el* ejemplo de paginación de clase; hoy se traen todas | S-M | No |
| **Compartir el regalo por WhatsApp** desde la confirmación de compra | Cierra el flujo del regalo | S | No |
| **Mapa real** (Leaflet + coordenadas en el back) | Hoy el mapa es ilustrativo | M | Sí |

### 4.4 Para la presentación

**Pitch (5-7 min):** problema ("¿qué hacemos este finde?") → solución (marketplace de experiencias de locales, con fecha
y cupo) → para quién (quien busca planes y quien quiere ganar plata compartiendo algo) → demo → modelo de negocio (10 %)
→ diferenciales (4.0) → cómo está hecho (React + Redux, Spring Boot + JWT, MySQL; 30 segundos de Redux DevTools) → próximos pasos (4.3).

**Guion de demo que recorre toda la consigna** (datos de ejemplo del seed: `sofia@plan.com` y `marcos@plan.com` con
`plan1234`, `admin@plan.com` con `admin123`):

| Paso | Cuenta | Requisito |
|---|---|---|
| 1. Registrarse como anfitrión (si se hace 4.1) o entrar como `marcos` | nueva / marcos | Registro de vendedores, login |
| 2. Publicar una experiencia con 2 fotos, categoría y precio | marcos | Alta de producto |
| 3. Sumarle fechas con cupo y un 15 % de descuento | marcos | Stock, descuentos |
| 4. Como visitante: buscar "Bariloche este finde, 2 personas", filtrar por categoría y precio | invitado | Catálogo, búsqueda, filtros |
| 5. Abrir el detalle; mostrar una fecha agotada | invitado | Detalle; sin stock bloqueado |
| 6. Entrar como `sofia`: agregar, cambiar cantidad, quitar | sofia | Carrito |
| 7. Pagar con cupón → voucher. Volver al detalle: los cupos bajaron | sofia | Total, stock |
| 8. Panel de admin: alertas, hacer admin a alguien, desactivar una cuenta | admin | Cuentas y permisos |
| 9. Redux DevTools: repetir el paso 7 mostrando `createOrder` pending → fulfilled y el carrito vaciándose | — | Redux |

**Antes de la demo:** cargar el seed **en la base que se vaya a usar** (borra todo), probar el guion entero una vez y
decidir si se presenta con `npm run dev` o con el build de producción (ver 2.1).

---

## 5. La lista vieja (`CONTEXTO-MEJORAS.md`) revisada

Ese archivo es de la 2da entrega (19/10) y ya no está en el repo. Varias cosas cambiaron con Redux:

### Quedó viejo (no seguirlo al pie de la letra)

| Decía | Ahora |
|---|---|
| `src/services/` con `fetch`, `src/context/` con providers, el `createContext` en los hooks | Todo eso se borró: `src/redux/` (slices + `api.js` con axios). Ver `REDUX-TERCERA-ENTREGA.md` |
| "No romper: `services/` como única puerta al back" | La única puerta ahora es `src/redux/api.js` (y solo la usan los slices) |
| "No romper: `CatalogProvider` como única carga del catálogo" | Ahora lo pide `App.jsx` una vez y queda en los slices `experiences`, `sessions`, `categories` |
| Guardado en `localStorage`: `etrip:token`, `plan:profileExtras`, `plan:favoritesByUser`, `plan:savedCards`, `plan:theme`, `plan:currency`, `plan:recentSearches` | Lo guarda redux-persist: `persist:auth` (token y usuario), `persist:preferences` (tema, moneda, búsquedas), `persist:savedCards`, `persist:recentlyViewed`. El perfil y los favoritos están en el back |
| "Filtros híbridos: texto, precio final, fechas, viajeros… siguen en el front" | Desde `cb4d2af` **todos** los filtros los resuelve el back; el front solo ordena y muestra de a 8 |
| "Carrito y checkout piden las fechas al entrar" | Ya no: se piden una vez. El back valida al pagar y, si rechaza, el front vuelve a pedir carrito y fechas |
| "Se actualiza con `reload()` / `refreshSessions()`" | Ya no existen: los reducers actualizan el store con la respuesta del back |
| "`notify(msg, tone, { label, to })`" | `dispatch(showToast({ message, tone, link }))` |
| `openAuth(mode, redirectTo)` | `dispatch(openAuth({ mode, redirect }))` |
| "Cómo verificar: en Network el catálogo se pide una sola vez" | Sigue valiendo en producción; en `npm run dev` se ve 2 veces por StrictMode (2.1) |

### Ya resuelto

| Pendiente | Estado |
|---|---|
| 3ra entrega: pasar Auth, Carrito y Catálogo a Redux | ✅ Todo el front está en Redux |
| Listados livianos (todas las fotos en base64) | ✅ El back manda solo la portada en los listados |
| Capa de servicios con URL base, token, logout en 401 | ✅ `api.js` (axios + interceptores; cierra la sesión si el token venció) |
| `ErrorState` reutilizable | ✅ Y se sumó en todas las secciones del panel y del modo anfitrión |
| Agregar experiencias en otra ciudad | ✅ El seed tiene 9 ciudades |
| Galería con 2-3 fotos por experiencia | ✅ El seed trae varias fotos por experiencia |
| 1.8 IDs con contador de módulo | ✅ Ya no aplica (los ids vienen del back) |

### Sigue pendiente

| Pendiente | ¿Back? | Recomendación |
|---|---|---|
| Perfil en el back (bio, ciudad, intereses, foto) | Sí | ✅ Hecho (16/11) |
| Borrar experiencias: el back bloquea si tuvo cualquier reserva | — | ✅ Ahora "dar de baja" reembolsa y avisa a todos; además hay **Pausar** |
| Recuperar contraseña por mail | Sí | Preguntar a la profe |
| Filtro de precio sobre el precio final | Sí | Verificar en el back que `minPrice`/`maxPrice` filtre por precio con descuento |
| Ciudades habilitadas en el back (tabla `City`) | Sí | No hace falta para la entrega |
| Cotizaciones desde el back | Sí | No hace falta (están fijas y aclaradas) |
| Reservar con cantidades por tipo (adultos/niños/bebés) | Sí | No hace falta |
| Coordenadas por experiencia (mapa exacto) | Sí | No hace falta |
| Favoritos y tarjetas guardadas en el back | Sí | ✅ Favoritos en el back (`/favorites`); las tarjetas quedan en el navegador |
| Vistos recientemente | No | ✅ `recentlyViewedSlice` persistido |
| `Tabs` con `role="tablist"` y flechas | No | S, accesibilidad |
| Filtros en el celu como panel aparte (drawer) | No | Opcional |
| Esqueletos de carga (`Skeleton`) | No | Opcional |
| Revisión de seguridad del back: enumeración de cuentas, el reset no invalida tokens viejos, secreto JWT en `application.properties` | Sí | Mencionar como "próximo paso" si preguntan |

---

## 6. Prioridades sugeridas

**Imprescindible (consigna y defensa)**
- [x] ~~4.1 Registro de vendedores~~ (decidido: toda cuenta compra y vende)
- [x] 3.1 Búsqueda por texto ✅
- [x] 3.4 Botón Pausar / Activar en Mis experiencias ✅
- [x] 3.5 Textos que no son ciertos ✅
- [x] 3.2 Intereses: tags en el back + "Para vos" ✅
- [ ] Ensayar la defensa de Redux con Redux DevTools y decidir dev vs. producción para la demo (S)
- [ ] Probar el guion de demo de punta a punta (S) — sumar al guion: guardar con el corazón, lista de espera, regalo y dar de baja una experiencia (los compradores reciben el aviso)
- [ ] **Volver a cargar el seed** en la base de la demo: el seed nuevo trae tags, perfiles, guardados, lista de espera y el regalo

**Muy recomendable**
- [x] Anfitrión destacado + números de PLAN en el Home ✅
- [x] "Agregar a mi calendario" en el voucher ✅
- [x] Vistos recientemente con Redux ✅
- [x] Ocultar "Datos de prueba" en producción ✅
- [x] Rendimiento: cargar aparte admin, anfitrión y editor ✅

**Hecho también (necesitaban back)**
- [x] Perfil del anfitrión en el back ✅ · Guardados ✅ · Lista de espera ✅ · Regalar ✅ · Dar de baja con reembolso y aviso ✅

**Si hay tiempo (ver 4.5)**
- [ ] Página "Ser anfitrión" con calculadora (S-M)
- [ ] Reseñas con foto del autor (S, back)
- [ ] Reseñas paginadas en el detalle (S-M)

**No hacer:** deploy, tests del front, filtros en Redux.

---

## 7. Para decidir en equipo

1. ¿La demo se hace con `npm run dev` (GET doble por StrictMode, explicable) o con el build de producción?
2. ¿Quién defiende qué parte de Redux? (sugerido: store y slices · thunks y axios · persistencia y "un solo GET" · slices que escuchan a otros: regalo, baja, lista de espera).
3. ¿Se hace la página "Ser anfitrión" (4.5)?
4. ¿Recuperar contraseña sigue por consola o se pregunta a la profe?

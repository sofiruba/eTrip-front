# Contexto: mejoras del front de eTrip

Documento de traspaso para una sesión que tenga abiertas **las dos carpetas** (front y back). Lista las mejoras del front ordenadas por prioridad, con su estado.

**Leyenda:** ✅ hecho · 🟡 hecho en parte · ⬜ pendiente

**Última actualización:** 7 de octubre de 2026.

## Situación actual

- **Concepto:** "hacé un plan distinto". Cualquiera puede organizar una experiencia (una cata en su terraza, un paseo por su barrio, un catamarán) y la compran locales que buscan algo diferente o turistas que quieren vivir la ciudad como alguien de ahí. Empieza en Buenos Aires, pero el modelo es **multi-ciudad**: la home arranca con un buscador Lugar · Fechas · Personas (todo opcional).
- **Dominio:** marketplace de *experiencias* (no productos genéricos). Está **aprobado por la cátedra** como e-commerce. Mapeo con la consigna del TPO: producto → experiencia, stock → cupos (`availableSeats` de cada sesión), vendedor → anfitrión (`publisherId`).
- **Front (`eTrip-front`):** React 19 + Vite 8 + react-router-dom 7 (data router: `createBrowserRouter` en `main.jsx`, rutas declaradas en `App.jsx`) + lucide-react. CSS plano con custom properties. **100% mock:** no hay ningún `fetch`. La "base" vive en memoria en `src/context/StoreProvider.jsx` y se pierde al recargar. Persisten en `localStorage`: `plan:userId`, `plan:cart`, `plan:favoritesByUser` (favoritos por usuario; el back no tiene favoritos), `plan:savedCards`, `plan:theme`, `plan:recentSearches`.
- **Back:** hecho, en la otra carpeta. Todavía no se conectó. **El objetivo es dejar el front terminado primero y después conectarlo.**

### Arquitectura del front (respetarla)

```
src/data/*             entidades semilla con forma de DTO del back
src/data/selectors.js  funciones puras que calculan lo que devolvería el back (toExperienceDTO, filterExperiences, validateCoupon…)
src/utils/*            lógica pura (orders, cancellation, catalogFilters, cards, format)
src/context/*          providers: Toast > Store > Auth > Favorites > SavedCards > Cart
src/hooks/*            el createContext vive en el archivo del hook, no en el provider
src/components/ui/*    componentes base (Button, Modal, DataTable, EmptyState, FormField, Notice, Tabs…)
src/pages/*            páginas
src/styles/tokens.css  design tokens (claro + oscuro) · src/styles/base.css  reset + utilidades
```

Convenciones: comentarios y textos de UI en español rioplatense (voseo), un `.css` por componente, todo color/espaciado vía tokens.

---

## Lo que dice el back (respuestas a los "verificar en el back")

| Tema | Back | Front |
|---|---|---|
| Roles | Solo `CLIENTE` y `ADMIN` | No hay rol vendedor: cualquier usuario publica. El registro tiene un check "También quiero publicar" que lleva a `/anfitrion`. |
| Login | `AuthenticationRequest.usernameOrEmail` + `password` | ✅ Campo "Email o usuario". |
| Registro | `RegisterRequest`: `username, firstname, lastname, email, password` | ✅ El form usa esos nombres (ojo: `firstname`/`lastname` en minúscula; la respuesta usa `firstName`/`lastName`). |
| Fotos de experiencias | `POST`/`PUT /experiences` en `multipart/form-data` (parte `experience` = JSON en texto, partes `images`) | El editor valida tipo y tamaño. Al conectar: armar un `FormData`. |
| Foto de perfil | `PUT /users/me/avatar` (multipart, parte `avatar`) y `DELETE /users/me/avatar`; llega como `avatarBase64` | En el mock se guarda como data URL en `user.avatarUrl`. |
| Perfil | `PUT /users/me` con `firstName`, `lastName`, `bio`, `city`, `interests` (todos opcionales). **El email no se puede cambiar.** | ✅ `EditProfileModal` ya no deja editar el email. |
| Carrito | Vive en el back: `/carts/user/{id}`, ítems con `cartItemId` | Hoy en `localStorage`. Al conectar: el local queda para invitados y se mergea al loguear. |
| Búsqueda | `GET /experiences?page&size&categoryId&title&location&minPrice&maxPrice&onlyDiscounted&dateFrom&dateTo` → `Page<>` | ✅ La URL del catálogo usa esos nombres. No hay `sort` ni rating mínimo en el back: el orden es solo del front. `dateFrom`/`dateTo` están como `YYYY-MM-DD`; el back espera ISO date-time, convertir al conectar. |
| Ventas | `GET /bookings/sales` | Usarlo al conectar en vez de calcular en el front. |
| Ciudades | `location` es un texto libre y el filtro es "contiene" (sin distinguir mayúsculas) | La ubicación se guarda como `"Barrio, Ciudad"` (`utils/location.js`). Buscar una ciudad = mandar su nombre en `location`. El editor pide Ciudad y Barrio por separado. Sin cambios en el back. |

### Cambios hechos en el back (mínimos)

- `utils/ImageCompressor`: la compresión de fotos que estaba en `ExperienceServiceImpl` se movió a una utilidad compartida (misma lógica).
- `User`: nuevos campos `avatar` (LONGBLOB), `bio`, `city` e `interests` (tabla `user_interests`). Con `ddl-auto=update` se crean solos.
- `UserUpdateDTO` / `UserResponseDTO`: agregan `bio`, `city`, `interests` y (respuesta) `avatarBase64`.
- `UsersController` / `UserService`: `PUT /users/me/avatar` y `DELETE /users/me/avatar`; `PUT /users/me` acepta los campos nuevos.
- `User.active` (default `true`): `isEnabled()` lo respeta, así una cuenta desactivada no puede loguearse. `PATCH /users/{id}/active?active=` solo ADMIN (no a sí mismo). `UserResponseDTO.active`.
- `DiscountCoupon.maxUses` (null = sin límite). La respuesta suma `usedCount` (órdenes que lo usaron). La validación (`GET /discount-coupons/validate` y al crear la orden) devuelve `USAGE_LIMIT_REACHED` si se llegó al tope. En el request de update, `maxUses <= 0` quita el límite.
- Ya existía y ahora el front lo replica: **cada usuario puede usar un cupón una sola vez**, y borrar un cupón ya usado lo desactiva en vez de borrarlo.
- `Experience.minAge` (null/0 = todas las edades, bebés incluidos; 4 = sin bebés; 18 = solo adultos). Va en request y response. `GET /experiences?youngestAge=N` devuelve solo las experiencias con `minAge <= N`.
- ⚠️ Diferencia pendiente: el back no deja borrar una experiencia que tenga **cualquier** sesión; el front (anfitrión y admin) la deja borrar si no tiene reservas próximas, y borra sus sesiones. Decidir cuál regla queda antes de conectar.

---

## Prioridad 1 — Bugs de lógica

- ✅ **1.1 El carrito pisaba la cantidad.** `CartProvider.add` suma y topea por cupo.
- ✅ **1.2 El badge contaba líneas.** `count` suma cantidades (lugares). El `aria-label` del navbar dice "N lugares".
- ✅ **1.3 Política de 48 h.** `BookingDetailPage` usa `getCancellationPolicy` para `canRefund` y muestra la política. El admin puede seguir reembolsando siempre. ⬜ Verificar que el back aplique la misma regla.
- ✅ **1.4 El reembolso no ajustaba la orden.** `utils/orders.js`: `getRefundAmount` (prorratea el cupón), `getOrderRefunded`, `getNetSales`. Admin muestra ventas netas; `OrderSummary` tiene línea "Reembolsado" y "Total neto"; `RefundModal` muestra el monto real.
- ✅ **1.5 La card prometía fechas agotadas.** `nextSession` = primera sesión futura con cupos. El DTO suma `upcomingCount`.
- ✅ **1.6 "Sin fechas" vs "Agotado".** `BookingPanel` los distingue; las sesiones agotadas se ven deshabilitadas.
- ✅ **1.7 Cupones sin límite de uso.** Agregado `maxUses` en el back y en el front, más la regla de un uso por usuario.
- ⬜ **1.8 IDs con contador de módulo** en `StoreProvider`. Bajo impacto: desaparece al conectar el back.

## Prioridad 2 — Estado "Agotado" (lo pide la consigna)

- ✅ Badge "Agotado" en `ExperienceCard` (`isSoldOut` en `selectors.js`) con la foto apagada.
- ✅ "¡Quedan N!" (umbral `LOW_SEATS = 5`) en la card y en `BookingPanel`.
- ✅ `CartPage` marca líneas agotadas, pasadas o que superan el cupo (botón Ajustar/Quitar) y bloquea "Continuar al pago".
- ✅ Aviso en `CartPage` cuando se descartan sesiones borradas (`missingCount` en `CartProvider`).
- ✅ `BookingPanel` descuenta lo que ya está en el carrito del máximo elegible.

## Prioridad 3 — Descubrimiento

- ✅ Orden (`?orden=`): recomendadas, precio ↑/↓, mejor puntuadas, más próximas.
- ✅ Filtros con nombres del back: precio, fecha (Hoy / Este finde / 7 días / rango), zona, solo ofertas, solo con lugares (`?disponibles=`, solo front).
- ⬜ Rating mínimo (el back no lo soporta; se descartó).
- ✅ Normalizar acentos (`normalizeText` en `utils/format.js`).
- ✅ El buscador de texto del navbar se reemplazó por una píldora (`NavbarSearch`) que abre el mismo `HeroSearch`. En la home se oculta mientras el buscador grande está a la vista. La búsqueda por nombre quedó como sugerencias de experiencias dentro del campo Lugar.
- ✅ "Cargar más" (`PAGE_SIZE = 8`, `?page=`). Con 4 experiencias semilla no aparece.
- ✅ Chips de filtros activos, "Limpiar todo", contador de resultados y sección "Ofertas" en la home.
- 🟡 Filtros en mobile: panel desplegable, no un drawer aparte.

### Buscador principal (home)

- ✅ `HeroSearch`: Lugar (con "Cerca tuyo", búsquedas recientes y destinos), Fechas (atajos + rango) y Personas. Todo opcional; se puede buscar solo por lugar.
- ✅ "Cerca tuyo" usa la geolocalización del navegador (sin API externa): busca la ciudad con experiencias más cercana en `data/cities.js` (hasta 150 km).
- ✅ Viajeros por edad (`?adultos=&ninos=&bebes=`, solo front): adultos 18+, niños 4–17, bebés 0–3 (no ocupan lugar; con niños o bebés se suma 1 adulto). Filtra fechas con lugar para adultos+niños y, con `youngestAge` (0 si hay bebés, 4 si hay niños), experiencias que los admiten. El detalle recibe `?personas=` para precargar la cantidad. Lógica en `utils/guests.js`.
- ✅ Edad mínima por experiencia: el anfitrión la elige en el editor ("¿Quiénes pueden ir?"); se ve en el detalle, como "+18" en la tarjeta y como aviso al reservar.
- ✅ Cada campo del buscador tiene una "×" para vaciarlo (reemplaza a "Cualquier fecha" / "Sin especificar"). Calendario más compacto.
- ✅ La píldora del navbar despliega una franja angosta con la barra debajo del navbar (sin el panel blanco grande); los desplegables flotan sobre la página atenuada.
- ⬜ Reservar con cantidades por tipo (adultos/niños/bebés) en el detalle: hoy el panel de reserva sigue siendo una sola cantidad de personas; requiere cambiar el modelo de reserva en el back.
- ✅ Ciudad sin experiencias → vacío que invita a publicar la primera.
- ✅ Calendario propio de rango (`DateRangeCalendar`): dos meses, días con planes marcados, atajos de fecha.
- ✅ Orden de la home: buscador → próximos planes → Explorá (catálogo) → Ofertas → "¿Tenés algo para compartir?".
- ✅ Migas del detalle: Inicio › Ciudad › Categoría › Experiencia.
- ⬜ Agregar experiencias semilla en otra ciudad para mostrar el modelo multi-ciudad (faltan imágenes).
- ⬜ Coordenadas por experiencia (mapa real y "cerca tuyo" por distancia exacta): requiere `latitude`/`longitude` en el back.

### Panel de administración

- ✅ La cuenta admin es solo de gestión: navbar con "Panel" y "Ver sitio", sin carrito, reservas, perfil ni modo anfitrión (`CustomerOnly` en `App.jsx` muestra un aviso si entra a esas rutas). En el detalle de una experiencia ve "Gestionar en el panel" en vez de reservar. Aviso "Estás viendo el sitio como administrador" fuera del panel.
- ✅ Barra lateral agrupada: General (Resumen) · Catálogo (Experiencias, Categorías) · Personas (Usuarios) · Ventas (Órdenes, Reservas, Cupones) · Moderación (Reseñas).
- ✅ Resumen: indicadores (ventas netas, órdenes, reservas próximas, usuarios, experiencias, puntuación promedio), "Requiere atención" con links a la sección ya filtrada (`?estado=`, `?puntuacion=`), más vendidas y últimas órdenes. Umbrales en `components/admin/adminRules.js`.
- ✅ Experiencias (nueva): todo el catálogo con disponibilidad, puntuación y ventas; detalle con próximas fechas; dar de baja (bloqueado si hay reservas próximas).
- ✅ Todas las secciones con `AdminToolbar` (buscar + filtros + contador) y `DataTable` con orden por columna y paginación.
- ✅ Usuarios: filtros por rol y estado, reservas/publicadas, confirmación antes de cambiar rol o desactivar.
- ✅ Cupones: columna de usos ("3 / 50" con barra), estado "Agotado", campo "Límite de usos".
- ✅ Reseñas: filtro por puntuación y marca en las de 2★ o menos.

## Prioridad 4 — Preparar la conexión con el back

1. ⬜ **Capa `src/services/`** + `http.js` (base URL por `VITE_API_URL`, `Authorization: Bearer`, logout en 401, proxy de Vite).
2. 🟡 **Estados de carga y error.** ✅ `ErrorBoundary` en `AppLayout`. ⬜ `Skeleton`, `ErrorState`, `Spinner` reutilizables (tienen sentido recién con requests).
3. ✅ **Error Boundary** alrededor de las rutas.
4. ✅ **Auth:** username en el registro, la contraseña viaja (en el mock se valida si la cuenta la tiene), login por email o usuario, mostrar/ocultar contraseña, redirect al destino después del login (`openAuth(mode, redirectTo)`). ⬜ JWT real y dónde guardar el token.
5. ✅ **Roles:** resuelto según el back (ver tabla).
6. 🟡 **Imágenes:** validadas en el editor y en la foto de perfil. ⬜ Enviar los `File` en un `FormData` al conectar.
7. ⬜ **Cotejar DTOs** entidad por entidad al conectar.

## Prioridad 5 — Sistema de diseño

- ✅ Tokens de z-index (`--z-raised` … `--z-overlay`) y pesos (`--weight-*`).
- 🟡 Breakpoints: documentados (600 / 900 / 1200) en `tokens.css`, pero los `@media` existentes todavía usan los valores viejos.
- ⬜ `font-size` en px en `Avatar.css`, `Logo.css`, `Navbar.css`, `HomePage.css`, `PaymentMethods.css`.
- ✅ Dark mode: tokens oscuros (marrones cálidos), toggle en el navbar (`useTheme`), script en `index.html` para no parpadear. Tokens nuevos: `--color-on-brand`, `--color-brand-text`, `--color-inverse`, `--color-glass`, `--color-scrim`, `--color-*-solid`, etc. Quedan hex solo en logos de marcas y en bloques que siempre son oscuros.
- ✅ Precio de la card en `--text-lg` 700; descuento arriba a la izquierda; `--color-muted` oscurecido a `#5f5d59`.
- ⬜ Galería: sumar 2–3 fotos por experiencia semilla (no hay imágenes extra en el proyecto).
- ✅ `DataTable` (admin): orden por columna y paginación; búsqueda y filtros con `AdminToolbar`.

## Prioridad 6 — Accesibilidad

- ✅ Focus trap en modales y devolución del foco al que lo abrió (`useModalBehavior(onClose, panelRef)`).
- ✅ Skip link "Saltar al contenido" → `<main id="contenido">`.
- ⬜ `Tabs` con `role="tablist"` / `tab` / `tabpanel` y flechas.

## Extras de e-commerce

- ✅ "También te puede gustar" en el detalle.
- ✅ Migas de pan (`PageHeader breadcrumbs`), barra fija "Ver fechas" en mobile.
- ✅ Toast con acción "Ver carrito" (`notify(msg, tone, { label, to })`), "Ahorrás $X" en el carrito.
- ✅ Pasos del checkout (`CheckoutSteps`).
- ✅ Títulos de pestaña por página (`useDocumentTitle`).
- ✅ Páginas de Ayuda/FAQ, Términos y Privacidad + footer con columnas.
- ✅ Descuento rápido desde Mis experiencias (`DiscountModal`) y aviso de cambios sin guardar en el editor (`useUnsavedChanges`).
- ✅ Foto de perfil (`AvatarUploader`, `Avatar src`) con fallback a iniciales; se ve en navbar, reseñas, perfil público y admin.
- ✅ Perfil: intereses como píldoras con ícono de trazo fino estilo Airbnb (`InterestList`, `interestIcons.js` + íconos propios en `interestGlyphs.jsx`). 40 intereses (`data/interests.js`), selector con 16 destacados + "Mostrar todo" y contador "n/20 seleccionados" (el back limita a 20). @usuario, rol "Miembro/Anfitrión", "Ver perfil público", tarjeta "Completá tu perfil". Intereses también en el perfil público.
- ⬜ Vistos recientemente (`localStorage`).
- ⬜ Distribución de estrellas en `ReviewsSection`.
- ⬜ "Volver a reservar" en reservas pasadas.

---

## Cosas que están bien y no hay que romper

- `selectors.js` como capa pura con forma de DTO.
- Búsqueda y filtros en la URL.
- Doble chequeo de cupos en `CheckoutPage` (antes y después del pago simulado).
- `src/utils/cards.js` (Luhn, marca, vencimiento) y que nunca se guarde el número completo ni el CVV.
- `DataTable` responsive, `ImageWithFallback`, pila de modales en `useModalBehavior`, `prefers-reduced-motion`, `:focus-visible` global, `@media print` del voucher.

## Cómo verificar

- `npm run dev` y recorrer: catálogo con filtros/orden → experiencia agotada → carrito (sumar cantidades, badge, avisos) → checkout con cupón → reserva a menos de 48 h (no debe dejar reembolsar) → admin (ventas netas) → perfil (foto, intereses) → modo oscuro.
- `npm run lint` (oxlint) y `npm run build` sin errores. Back: `./mvnw compile`.
- Cuentas demo: `sofia@plan.com` (cliente), `admin@plan.com` (admin). Para ver el modo anfitrión con contenido: `nico@plan.com`, `mica@plan.com` o `santi@plan.com`. Cualquier contraseña de 6+ caracteres.

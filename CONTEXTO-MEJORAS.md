# Contexto: mejoras del front de eTrip

Documento de traspaso para una sesión que tenga abiertas **las dos carpetas** (front y back). Arriba está el estado real de hoy y el análisis de la 2da entrega; más abajo, el historial de mejoras por prioridad.

**Leyenda:** ✅ hecho · 🟡 hecho en parte · ⬜ pendiente

**Última actualización:** 19 de octubre de 2026.

## Situación actual

- **Concepto:** "hacé un plan distinto". Cualquiera puede organizar una experiencia (una cata en su terraza, un paseo por su barrio, un catamarán) y la compran locales que buscan algo diferente o turistas que quieren vivir la ciudad como alguien de ahí. Empieza en Buenos Aires, pero el modelo es **multi-ciudad**: la home arranca con un buscador Lugar · Fechas · Personas (todo opcional).
- **Dominio:** marketplace de *experiencias*, **aprobado por la cátedra** como e-commerce. Mapeo con la consigna: producto → experiencia, stock → cupos (`availableSeats` de cada sesión), vendedor → anfitrión (`publisherId`).
- **Entregas:** 2da (20/10) = front + integración con el back, con **Context** (sin Redux). 3ra (24/11) = Redux y recuperar contraseña "de verdad".
- **Front (`eTrip-front`):** React 19 + Vite 8 + react-router-dom 7 (data router: `createBrowserRouter` en `main.jsx`, rutas en `App.jsx`) + lucide-react. CSS plano con custom properties. **Conectado al back**: todas las llamadas pasan por `src/services/api.js` (`fetch` + `.then/.catch`, token `Bearer`). La URL del back sale de `VITE_API_URL` (ver `.env.example`; por defecto `http://localhost:4002`).
- **Guardado solo en el navegador** (`localStorage`): `etrip:token`, `plan:profileExtras` (bio, ciudad, intereses y foto: **el back no los tiene**), `plan:favoritesByUser`, `plan:savedCards`, `plan:theme`, `plan:recentSearches`.
- **Back (`eTrip-back`):** Spring Boot en el puerto 4002, MySQL `etrip_db`. Endpoints y reglas en `eTrip-back/insomnia/ENDPOINTS.md`.

### Arquitectura del front (respetarla)

```
src/services/*         un archivo por recurso del back; api.js = request() con fetch, token y manejo de errores
src/context/*          providers: Toast > Catalog > Auth > Favorites > SavedCards > Cart
                       CatalogProvider: experiencias, fechas y categorías públicas, pedidas UNA vez al abrir la app
src/hooks/*            el createContext vive en el archivo del hook (useCatalog, useCart…), no en el provider
src/routes/*           RequireAuth, CustomerOnly, RemountOnParam (vuelve a montar la página si cambia :id o se reintenta)
src/utils/*            lógica pura (catalogFilters, experiences, cart, orders, cancellation, coupons, cards, format)
src/components/ui/*    componentes base (Button, Modal, DataTable, EmptyState, ErrorState, FormField, Notice, Tabs…)
src/pages/*            páginas (una por ruta)
src/styles/tokens.css  design tokens (claro + oscuro) · src/styles/base.css  reset + utilidades
```

Convenciones: comentarios y textos de UI en español rioplatense (voseo), un `.css` por componente, todo color/espaciado vía tokens. Nada de `document.getElementById/querySelector` dentro de componentes: se usan refs (las únicas excepciones están comentadas: el navbar mira elementos del Home, que es otra rama del árbol).

---

## 2da entrega: análisis y arreglos (16/10/2026)

Se revisó el front contra lo visto en clase (Router, ciclo de vida + `useEffect`, promesas con `fetch`, estado con copias nuevas, props, `key`) y contra el back.

### Arreglado en el front
- ✅ **Carrito:** las fechas que ya no existen (pasaron, se cancelaron o se pausó la experiencia) antes se escondían pero seguían en el total y hacían fallar el pago; el aviso "Quitamos N fechas" era falso. Ahora se ven con "Quitar" y el checkout no deja seguir hasta sacarlas.
- ✅ **Catálogo único (`CatalogProvider`):** antes cada página volvía a bajar todas las experiencias con sus fotos; ahora se piden una vez con `Promise.all` (la carga termina cuando llegó todo) y se actualizan con `reload()` / `refreshSessions()` cuando algo cambia (publicar, comprar, cancelar una fecha, reembolsar). Carrito y checkout piden las fechas al entrar para ver los lugares reales.
- ✅ **Filtros híbridos en el Home:** categoría, ciudad/zona y "solo ofertas" van al back (`GET /experiences?categoryId&location&onlyDiscounted`) en un `useEffect` cuya dependencia es la query; una respuesta vieja se descarta en la limpieza del efecto. Texto, precio final, fechas con lugar, viajeros, "solo disponibles" y orden siguen en el front (el back no los resuelve igual).
- ✅ **Checkout:** el pago es simulado; la orden se crea en el back en el paso "Confirmando tu reserva…" y recién ahí se muestra "¡Listo!". Si el back la rechaza (sin cupos, cupón ya usado…) se muestra su mensaje ("No pudimos confirmar tu compra"), no "el banco rechazó el pago". Se sacaron "cifrado de extremo a extremo" y "te mandamos los vouchers por email".
- ✅ **Cupones:** los motivos del back (`EXPIRED`, `ALREADY_USED`…) se muestran en castellano (`utils/coupons.js`).
- ✅ **Fechas del anfitrión y del admin:** usan `GET /experience-sessions/manage` (historial con pasadas y canceladas). `HostCalendar` tenía el chequeo invertido (bloqueaba cancelar fechas futuras con reservas); ahora solo bloquea las que ya empezaron y avisa cuántas plazas se reembolsan. "Pausada" → "Cancelada".
- ✅ **Doble envío:** editor de experiencias, botón Reservar y modales (descuento, cupón, categoría, perfil) se deshabilitan mientras el back responde. En el editor, si el PATCH de descuento falla después de crear, reintentar edita en vez de duplicar.
- ✅ **Error ≠ vacío:** `ErrorState` con "Reintentar" en detalle de reserva (antes quedaba cargando para siempre), perfil de anfitrión, mis reservas, confirmación de compra y resumen del admin.
- ✅ **Sesión vencida:** `api.js` lee el vencimiento del JWT; si venció, cierra la sesión, avisa y abre el login sobre la misma página.
- ✅ **Prácticas de clase:** actualizadores funcionales (`setX((current) => …)`) en los paneles de admin, refs en vez de buscar en el DOM, keys de fotos que no se repiten, `RemountOnParam` para que "editar" → "nueva" no arrastre el formulario.
- ✅ **Reembolso:** se sacó el campo "motivo" que nunca se mandaba.
- ✅ **Confirmación de compra (19/10):** decía "Te enviamos el comprobante a tu email" y no se manda ningún mail; ahora dice que los vouchers quedaron en Mis reservas.
- ✅ **Sobre nosotros (19/10):** se sacaron las dos filas de planes que se movían (marquee) y el bloque negro con la cita; ahora hay una frase fija de planes de ejemplo separados por el ✦ del logo.
- ✅ **Filtros nuevos (19/10), todos en el front:** precio con histograma + slider de dos manijas (`PriceFilter`, `ui/RangeSlider`) armado con los precios finales del catálogo ya cargado; **duración** (30 min … 5 h o más, de `endsAt − startsAt` de cada fecha) y **horario** (mañana < 12, tarde 12–17, tarde-noche ≥ 17, por la hora de inicio). Van en la URL (`duracionMin`, `duracionMax`, `horario=manana,tarde`) y una misma fecha tiene que cumplir fechas + personas + duración + horario (`filterExperiences`).
- ✅ **Navbar (19/10):** la barra de búsqueda muestra 1, 2 o 3 campos según el lugar (190 / 325 / 427 px, medidos en Chrome) sin dejar hueco; el navbar ahora sí llega a 1440 px (`.container.navbar__inner`, antes lo pisaba el 1200 de `.container`); hasta 1280 px el menú de usuario muestra solo el avatar y los bloques van más juntos; con sesión, "Sobre nosotros" queda solo en el footer.
- ✅ **Ciudad en el editor (19/10):** `CityField` reemplaza al `<datalist>` del navegador (no se podía estilar). Combobox accesible (↑ ↓ Enter Escape) con primero las ciudades que ya tienen experiencias (del catálogo, o sea del back, con cuántas) y después las de `data/cities.js`; se puede escribir cualquier ciudad. `cities.js` queda como dato de referencia: también tiene las coordenadas de "Cerca tuyo".
- ✅ **Ciudad libre (19/10):** se sacó la validación contra la lista fija ("Elegí una ciudad válida de la lista"), que solo existía en el front: el back no tiene lista. Regla: el anfitrión publica en cualquier ciudad (sin números, mínimo 2 letras, igual que valida el back). Para no duplicar, `canonicalCity` guarda "cordoba" como "Córdoba" si coincide sin acentos con una conocida o con una que ya tiene experiencias; una nueva se guarda como se escribió, con mayúscula inicial.
- ✅ **Moneda (19/10):** botón "$ ARS" en el footer → modal "Elegí una moneda" (ARS, USD, EUR, GBP, CHF, BRL, UYU, CLP). Regla: todo se publica y se cobra en **pesos**; la moneda es solo cómo se ven los precios (`plan:currency` en `localStorage`). Cotizaciones de referencia fijas en `data/currencies.js` (con fecha). Se convierte en tarjetas, detalle y filtro de precio (los campos se escriben en la moneda elegida y se pasan a pesos; la URL sigue en pesos). En carrito, checkout y confirmación se muestra el monto en pesos con `<Approx>` ("≈ US$ 20") y "Se cobra en pesos argentinos". Admin y anfitrión, siempre en pesos (`<Money pesos />`). Piezas: `CurrencyProvider` + `useCurrency`, `ui/Approx`, `layout/CurrencyModal`, `formatCurrency` en `utils/format.js`.
- ✅ **Navbar en el celu con sesión (19/10):** los íconos no entraban en 390 px y la página se corría para el costado. Hasta 600 px el botón de tema pasa al menú ☰, los íconos van más juntos y el avatar va sin la flechita.

### Arreglado en el back (con OK)
- ✅ Permisos: categorías solo las crea/edita/borra un ADMIN; los clientes solo pueden `GET /discount-coupons/validate` (listar cupones es del admin); `GET /experiences/mine` y `/experience-sessions/manage` piden sesión.
- ✅ Una cuenta desactivada deja de entrar aunque su token no haya vencido (`JwtAuthenticationFilter` chequea `isEnabled()`).
- ✅ **No se sobrevende:** `createOrder` bloquea las sesiones del carrito (`SELECT … FOR UPDATE`) antes de validar cupos.
- ✅ Cupones: `/validate` devuelve `ALREADY_USED` si el usuario ya lo usó; la orden rechaza con mensajes claros.
- ✅ Reembolso: el comprador puede cancelar hasta **48 h antes** (igual que muestra el front); anfitrión y admin, hasta el inicio.
- ✅ Reseñas: una reserva reembolsada no habilita a reseñar.
- ✅ Una sesión no se puede mover a otra experiencia; mensajes claros en las validaciones de sesiones.
- ✅ `GET /users/{id}` sin sesión ya no da 500 (perfil reducido).
- ✅ CORS configurable: `CORS_ALLOWED_ORIGINS` (sumar la URL de Vercel al desplegar).
- ✅ Recuperar contraseña: el código pendiente pasó a su propia tabla `password_reset_codes` (antes eran tres columnas `reset_code_*` en `user`, casi siempre en NULL; se borraron a mano con `ALTER TABLE`). Lo único que falta a propósito es **mandar el mail**: el código vuelve en la respuesta y se ve en consola.

### Pendientes (no entran en la 2da)
- ⬜ Perfil en el back (bio, ciudad, intereses, foto): hoy en `localStorage`, así que nadie más ve la foto o la bio de un anfitrión.
- ⬜ Listados livianos: cada experiencia viaja con **todas** sus fotos en base64; en los listados alcanzaría con la portada.
- ⬜ Filtro de precio en el back sobre el precio final (hoy usa el de lista; por eso el precio se filtra en el front).
- ⬜ Favoritos y tarjetas guardadas en el back.
- ⬜ Borrar experiencias: el back la bloquea si tiene cualquier reserva (aunque estén reembolsadas); el front deja intentarlo si no hay reservas próximas.
- ⬜ 3ra entrega: pasar Auth, Carrito y Catálogo a Redux (el `CatalogProvider` es casi 1:1 un slice con un thunk que usa los mismos services).
- ⬜ 3ra entrega: **ciudades habilitadas en el back** (tabla `City` que maneja el admin, como las categorías, `GET /cities`, y el back rechaza ciudades fuera de la lista). Entonces `CityField` las pide al back en vez de usar `data/cities.js` y vuelve la validación "elegí de la lista", pero del lado del back.
- ⬜ 3ra entrega: cotizaciones desde el back (hoy fijas en `data/currencies.js`).

---

## Historial de mejoras (antes de conectar el back)

> Lo que sigue se escribió cuando el front era 100% mock (hasta el 13/10). Las referencias a `StoreProvider`, `selectors.js` o al carrito en `localStorage` ya no aplican.

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

### Login, registro y recuperar contraseña (13/10/2026)

- ✅ `AuthModal` quedó como orquestador; cada flujo en su componente: `LoginForm`, `RegisterForm`, `ForgotPasswordForm` (+ `PasswordField` con medidor de seguridad y `CodeInput` de 6 cajas).
- ✅ **Registro en 3 pasos** con barra de progreso: Tu cuenta (email + contraseña) → Sobre vos (nombre, apellido, usuario, tarjeta "así te van a ver") → Intereses (opcional: "Ahora no, los elijo después").
- ✅ **Email y usuario repetidos se avisan antes de los intereses**: `GET /api/v1/auth/availability`. El usuario se chequea en vivo mientras se escribe y hay sugerencias libres a partir del nombre (sofia.perez, sofiaperez…). Si el email ya existe, ofrece iniciar sesión con ese email precargado.
- ✅ **Recuperar contraseña**: "¿Olvidaste tu contraseña?" en el login → pedir código → ingresar código (se manda solo al completar los 6 dígitos, reenviar con espera de 30 s) → contraseña nueva + repetir → queda logueado.
- ⬜ **El código hoy se imprime en la consola del back y en la del navegador** (`devCode`, solo con `app.password-reset.show-code=true`) (`ConsolePasswordResetSender`). Falta preguntar a la profe si alcanza o si hay que mandarlo por mail; para mail, implementar `PasswordResetSender` con `spring-boot-starter-mail`.

## Prioridad 5 — Sistema de diseño

- ✅ Tokens de z-index (`--z-raised` … `--z-overlay`) y pesos (`--weight-*`).
- ✅ Breakpoints (19/10): los `@media` usan 420 / 600 / 900 / 1200 (580, 640 → 600; 760 → 900; 480 → 420; 1100 del resumen de admin → 1200). Excepciones documentadas en `tokens.css`: el navbar pasa a menú en 1080 y la X del buscador del navbar en 1100.
- ✅ `font-size` en px pasados a rem (19/10): `Avatar`, `Logo`, `Navbar`, `NotificationBell`, `PaymentMethods`, `CardBrandIcon`.
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
- ✅ Distribución de estrellas (19/10): `RatingBreakdown` (barras 5★…1★) se ve en la sección de reseñas del detalle y en su modal.
- ✅ "Volver a reservar" (19/10): en Mis reservas → Pasadas, debajo de cada tarjeta (prop `action` de `BookingCard`, fuera del link) si la experiencia sigue publicada; lleva al detalle con la misma cantidad de personas.

---

## Cosas que están bien y no hay que romper

- `services/` como única puerta al back (un archivo por recurso, `request` en `api.js`).
- `CatalogProvider` como única carga del catálogo público (no volver a pedir todo en cada página).
- Búsqueda y filtros en la URL (se puede compartir el link y volver con los filtros puestos).
- El back es el que valida cupos, cupones y total al crear la orden; el front solo avisa antes.
- `src/utils/cards.js` (Luhn, marca, vencimiento) y que nunca se guarde el número completo ni el CVV.
- `DataTable` responsive, `ImageWithFallback`, pila de modales en `useModalBehavior`, `prefers-reduced-motion`, `:focus-visible` global, `@media print` del voucher.

## Revisión "intentar romperlo" (19/10)

Cambios del back en `eTrip-back/insomnia/ENDPOINTS.md` → "Reglas que agregó la revisión de seguridad". En el front:
- `AvatarUploader` achica la foto a 320 px (JPEG) antes de guardarla: una de 4–5 MB llenaba localStorage y dejaba de guardarse todo el perfil local. `usePersistentState` ahora avisa por consola si no puede guardar.
- `CheckoutPage` manda `expectedTotal`; si el back lo rechaza (cambió un precio) recarga carrito y vuelve a calcular el cupón.
- Pendiente (no se tocó): filtro de precio sobre el precio de lista, enumeración de cuentas por `forgot-password`/`availability`, el reset no invalida tokens viejos, secreto JWT en `application.properties`.

## Cómo verificar

- Levantar MySQL y el back (`./mvnw spring-boot:run` en `eTrip-back`, puerto 4002) y después el front (`npm run dev`, puerto 5173).
- Recorrer: home con y sin filtros (en la pestaña Network, `categoryId`/`location`/`onlyDiscounted` viajan al back y el catálogo se pide una sola vez) → detalle → agregar al carrito → carrito con una fecha cancelada (aparece con "Quitar") → checkout con cupón inválido o ya usado → confirmación → reserva a menos de 48 h (no deja reembolsar) → anfitrión: crear experiencia, calendario con historial, cancelar una fecha futura → admin: categorías, cupones, fechas → modo oscuro.
- `npm run lint` (oxlint) y `npm run build` sin errores. Back: `./mvnw compile`.
- Cuentas: las de la base real. Para cargar datos de ejemplo está el panel de admin → "Cargar datos" (`src/data/sampleData.json`, escribe en la base: ver `PARA-LLENAR-EL-BACK.md`).

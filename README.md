# PLAN · Front

Marketplace de experiencias armadas por gente local: se publican, se buscan, se reservan y se pagan (pago simulado).
TPO de Aplicaciones Interactivas (UADE, 2° cuatrimestre 2026). El back es la carpeta `eTrip back` (Spring Boot).

**Tecnologías:** React 19 · Vite · react-router-dom 7 · **Redux Toolkit + react-redux** (estado global) ·
**axios** (llamadas al back) · **redux-persist** (sesión y preferencias al recargar) · lucide-react · CSS con
variables (modo claro y oscuro).

## Cómo levantarlo

1. Levantar el back (ver su README): queda en `http://localhost:4002`.
2. En esta carpeta:

```bash
npm install
npm run dev      # http://localhost:5173
```

Si el back está en otra dirección, copiá `.env.example` como `.env.local` y cambiá `VITE_API_URL`.
Otros comandos: `npm run build` (versión de producción en `dist/`) y `npm run lint` (oxlint).

## Cómo está armado

```
src/redux/      estado global con Redux Toolkit
src/hooks/      hooks propios (useCurrency, useTheme, useDocumentTitle, useUnsavedChanges…)
src/routes/     rutas protegidas (RequireAuth, CustomerOnly) y RemountOnParam
src/pages/      una página por ruta (las rutas están en App.jsx)
src/components/ componentes por sección (home, experience, checkout, booking, host, admin…) y ui/ (los de base)
src/utils/      funciones de presentación (filtros de la URL, fechas, formatos)
```

## Redux

- **Un store** (`store.js`, `configureStore`) con **un slice por entidad de la base**: experiences (catálogo,
  detalle, búsquedas y "Para vos"), sessions (fechas y resumen del anfitrión), categories, interests, currencies,
  cart, orders, bookings, reviews, users, coupons, notifications, favorites y waitlist. Además, `auth` (la sesión:
  token, usuario y modal de login) y slices solo de front: preferences, savedCards, recentlyViewed y toasts.
- **Todos los pedidos al back están en los slices**, como acciones asíncronas (`createAsyncThunk` + axios). Ningún
  componente llama a axios: despachan acciones (`useDispatch`) y leen el estado (`useSelector`).
- Cada pedido maneja `pending` / `fulfilled` / `rejected` en `extraReducers`. Si el back responde con error,
  `action.error.message` es el mensaje del back (lo arma el interceptor de `api.js`) y se muestra tal cual.
- **Un solo GET por lista:** los componentes piden una lista solo si todavía no está en el store. Después de un
  POST / PUT / PATCH / DELETE, el reducer actualiza el store con lo que devolvió el back (sin volver a pedir).
  Si el cambio afecta datos que calcula el back (por ejemplo, un reembolso cambia la orden), la lista se marca para
  volver a pedirse.
- **Las reglas de negocio están en el back:** el front no calcula comisiones, plazos de cancelación, estados ni
  recomendaciones; muestra lo que manda el back (`refundable`, `status`, `hostEarnings`, `reason`…).
- **Persistencia** con redux-persist: sesión, preferencias (moneda, tema), tarjetas guardadas y vistos recientemente.

Los endpoints del back están en `eTrip back/insomnia/ENDPOINTS.md`.

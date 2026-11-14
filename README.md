# PLAN (eTrip) · Front

Marketplace de experiencias armadas por gente local: se publican, se buscan, se reservan y se pagan (pago simulado).
TPO de Aplicaciones Interactivas (UADE, 2° cuatrimestre 2026). El back es el proyecto `eTrip-back` (Spring Boot).

**Tecnologías:** React 19 · Vite · react-router-dom 7 · **Redux Toolkit + react-redux** (estado global) · **axios** (llamadas al back) ·
**redux-persist** (sesión y preferencias al recargar) · lucide-react · CSS con variables (modo claro y oscuro). Sin TypeScript.

La migración a Redux de la tercera entrega está explicada, archivo por archivo, en [`REDUX-TERCERA-ENTREGA.md`](REDUX-TERCERA-ENTREGA.md).

## Cómo levantarlo

1. Levantar el back (`eTrip-back`): MySQL corriendo y `./mvnw spring-boot:run`. Queda en `http://localhost:4002`.
2. En esta carpeta:

```bash
npm install
npm run dev      # http://localhost:5173
```

Si el back está en otra URL, copiá `.env.example` como `.env.local` y cambiá `VITE_API_URL`.
Al desplegar en Vercel, `VITE_API_URL` se carga como variable de entorno del proyecto, y en el back hay que sumar la URL de Vercel a `CORS_ALLOWED_ORIGINS`.

Otros comandos: `npm run build` (versión de producción en `dist/`), `npm run lint` (oxlint).

## Cómo está armado

```
src/redux/      estado global con Redux Toolkit: store.js + un slice por entidad (experiencias, fechas, carrito,
                órdenes, reservas, reseñas, usuarios, cupones…). Cada slice tiene sus acciones asíncronas
                (createAsyncThunk + axios: GET, POST, PUT, PATCH, DELETE) y sus reducers. api.js es el cliente axios
src/hooks/      hooks propios (useCurrency, useTheme, useDocumentTitle…)
src/routes/     rutas protegidas (RequireAuth, CustomerOnly) y RemountOnParam
src/pages/      una página por ruta (las rutas están en App.jsx)
src/components/ componentes por sección (home, experience, checkout, host, admin…) y ui/ (base)
src/utils/      funciones puras (filtros, fechas, carrito, órdenes, cupones…)
```

Los endpoints del back están en `eTrip-back/insomnia/ENDPOINTS.md`.

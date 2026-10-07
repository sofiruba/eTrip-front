import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import AppProviders from './context/AppProviders'
import './styles/tokens.css'
import './styles/base.css'

// Data router con una sola ruta comodín: las rutas siguen declaradas en <App />,
// pero así funcionan hooks como useBlocker (aviso de cambios sin guardar).
const router = createBrowserRouter([
  {
    path: '*',
    element: (
      <AppProviders>
        <App />
      </AppProviders>
    ),
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)

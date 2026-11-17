import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { PersistGate } from 'redux-persist/integration/react'
import App from './App'
import { persistor, store } from './redux/store'
import './styles/tokens.css'
import './styles/base.css'

// Data router con una sola ruta comodín: las rutas siguen declaradas en <App />,
// pero así funcionan hooks como useBlocker (aviso de cambios sin guardar).
const router = createBrowserRouter([{ path: '*', element: <App /> }])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* El store de Redux para toda la app (useSelector / useDispatch) */}
    <Provider store={store}>
      {/* Espera a que redux-persist recupere del localStorage la sesión y las preferencias antes de mostrar la app */}
      <PersistGate loading={null} persistor={persistor}>
        <RouterProvider router={router} />
      </PersistGate>
    </Provider>
  </StrictMode>,
)

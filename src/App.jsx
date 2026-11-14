import { lazy, Suspense, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import AboutPage from './pages/AboutPage'
import AdminPage from './pages/AdminPage'
import BookingDetailPage from './pages/BookingDetailPage'
import CartPage from './pages/CartPage'
import ExperienceEditorPage from './pages/ExperienceEditorPage'
import ExperiencePage from './pages/ExperiencePage'
import HelpPage from './pages/HelpPage'
import HomePage from './pages/HomePage'
import HostPage from './pages/HostPage'
import HostProfilePage from './pages/HostProfilePage'
import LegalPage from './pages/LegalPage'
import MyBookingsPage from './pages/MyBookingsPage'
import NotFoundPage from './pages/NotFoundPage'
import ProfilePage from './pages/ProfilePage'
import { isTokenExpired } from './redux/api'
import { fetchMe, logout } from './redux/authSlice'
import { fetchCart } from './redux/cartSlice'
import { fetchCategories } from './redux/categoriesSlice'
import { fetchExperiences } from './redux/experiencesSlice'
import { fetchNotifications } from './redux/notificationsSlice'
import { fetchSessions } from './redux/sessionsSlice'
import CustomerOnly from './routes/CustomerOnly'
import RemountOnParam from './routes/RemountOnParam'
import RequireAuth from './routes/RequireAuth'

// El checkout solo se descarga cuando alguien va a pagar.
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const CheckoutSuccessPage = lazy(() => import('./pages/CheckoutSuccessPage'))

const lazyPage = (Page) => (
  <Suspense fallback={<div className="container page" aria-busy="true" />}>
    <Page />
  </Suspense>
)

function App() {
  const dispatch = useDispatch()
  const userId = useSelector((state) => state.auth.user?.id)
  const token = useSelector((state) => state.auth.token)
  // El token con el que se abrió la app (redux-persist lo recuperó de una visita anterior). useState se queda con el primero
  const [savedToken] = useState(token)

  // Al abrir la app: el catálogo público se pide UNA sola vez y queda en el store.
  // Home, detalle, carrito, checkout y el buscador lo leen de ahí sin volver a pedirlo.
  useEffect(() => {
    dispatch(fetchExperiences())
    dispatch(fetchSessions())
    dispatch(fetchCategories())
  }, [dispatch])

  // Sesión guardada: si el token venció se cierra; si no, traemos los datos actualizados del usuario (rol, contadores)
  useEffect(() => {
    if (!savedToken) return
    if (isTokenExpired(savedToken)) dispatch(logout())
    else dispatch(fetchMe())
  }, [savedToken, dispatch])

  // Carrito y avisos: se piden cuando hay un usuario (por eso userId va en las dependencias: login / logout)
  useEffect(() => {
    if (!userId) return
    dispatch(fetchCart())
    dispatch(fetchNotifications())
  }, [userId, dispatch])

  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Públicas */}
        <Route index element={<HomePage />} />
        <Route path="experiencias/:id" element={<ExperiencePage />} />
        <Route path="anfitriones/:id" element={<RemountOnParam page={HostProfilePage} />} />
        <Route path="nosotros" element={<AboutPage />} />
        <Route path="ayuda" element={<HelpPage />} />
        <Route path="terminos" element={<LegalPage doc="terminos" />} />
        <Route path="privacidad" element={<LegalPage doc="privacidad" />} />

        {/* Solo clientes: la cuenta admin gestiona desde el panel */}
        <Route element={<CustomerOnly />}>
          <Route path="carrito" element={<CartPage />} />

          {/* Requieren sesión */}
          <Route element={<RequireAuth />}>
            <Route path="checkout" element={lazyPage(CheckoutPage)} />
            <Route path="checkout/confirmacion/:orderId" element={lazyPage(CheckoutSuccessPage)} />
            <Route path="mis-reservas" element={<MyBookingsPage />} />
            <Route path="mis-reservas/:id" element={<RemountOnParam page={BookingDetailPage} />} />
            <Route path="perfil" element={<ProfilePage />} />
            <Route path="anfitrion/:tab?" element={<HostPage />} />
            {/* Misma página para crear y editar: RemountOnParam la monta de nuevo al pasar de una a otra */}
            <Route path="anfitrion/experiencias/nueva" element={<RemountOnParam page={ExperienceEditorPage} />} />
            <Route path="anfitrion/experiencias/:id/editar" element={<RemountOnParam page={ExperienceEditorPage} />} />
          </Route>
        </Route>

        {/* Solo administradores */}
        <Route element={<RequireAuth role="ADMIN" />}>
          <Route path="admin/:section?" element={<AdminPage />} />
          {/* El admin edita cualquier experiencia (fotos, texto, precio) con el mismo editor del anfitrión */}
          <Route path="admin/experiencias/:id/editar" element={<RemountOnParam page={ExperienceEditorPage} />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App

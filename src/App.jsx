import { lazy, Suspense } from 'react'
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
import CustomerOnly from './routes/CustomerOnly'
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
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Públicas */}
        <Route index element={<HomePage />} />
        <Route path="experiencias/:id" element={<ExperiencePage />} />
        <Route path="anfitriones/:id" element={<HostProfilePage />} />
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
            <Route path="mis-reservas/:id" element={<BookingDetailPage />} />
            <Route path="perfil" element={<ProfilePage />} />
            <Route path="anfitrion/:tab?" element={<HostPage />} />
            <Route path="anfitrion/experiencias/nueva" element={<ExperienceEditorPage />} />
            <Route path="anfitrion/experiencias/:id/editar" element={<ExperienceEditorPage />} />
          </Route>
        </Route>

        {/* Solo administradores */}
        <Route element={<RequireAuth role="ADMIN" />}>
          <Route path="admin/:section?" element={<AdminPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App

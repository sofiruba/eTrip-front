import { Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import AboutPage from './pages/AboutPage'
import AdminPage from './pages/AdminPage'
import BookingDetailPage from './pages/BookingDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import ExperienceEditorPage from './pages/ExperienceEditorPage'
import ExperiencePage from './pages/ExperiencePage'
import HomePage from './pages/HomePage'
import HostPage from './pages/HostPage'
import HostProfilePage from './pages/HostProfilePage'
import MyBookingsPage from './pages/MyBookingsPage'
import NotFoundPage from './pages/NotFoundPage'
import ProfilePage from './pages/ProfilePage'
import RequireAuth from './routes/RequireAuth'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Públicas */}
        <Route index element={<HomePage />} />
        <Route path="experiencias/:id" element={<ExperiencePage />} />
        <Route path="anfitriones/:id" element={<HostProfilePage />} />
        <Route path="nosotros" element={<AboutPage />} />
        <Route path="carrito" element={<CartPage />} />

        {/* Requieren sesión */}
        <Route element={<RequireAuth />}>
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="mis-reservas" element={<MyBookingsPage />} />
          <Route path="mis-reservas/:id" element={<BookingDetailPage />} />
          <Route path="perfil" element={<ProfilePage />} />
          <Route path="anfitrion/:tab?" element={<HostPage />} />
          <Route path="anfitrion/experiencias/nueva" element={<ExperienceEditorPage />} />
          <Route path="anfitrion/experiencias/:id/editar" element={<ExperienceEditorPage />} />
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

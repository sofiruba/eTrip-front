import AuthProvider from './AuthProvider'
import CartProvider from './CartProvider'
import CatalogProvider from './CatalogProvider'
import FavoritesProvider from './FavoritesProvider'
import SavedCardsProvider from './SavedCardsProvider'
import ToastProvider from './ToastProvider'

/**
 * Contextos globales: solo lo que usan muchas pantallas a la vez (sesión, catálogo público, carrito…).
 * Los datos propios de cada página (una reserva, el panel de admin, etc.) los pide esa página en su useEffect.
 */
function AppProviders({ children }) {
  return (
    <ToastProvider>
      <CatalogProvider>
        <AuthProvider>
          <FavoritesProvider>
            <SavedCardsProvider>
              <CartProvider>{children}</CartProvider>
            </SavedCardsProvider>
          </FavoritesProvider>
        </AuthProvider>
      </CatalogProvider>
    </ToastProvider>
  )
}

export default AppProviders

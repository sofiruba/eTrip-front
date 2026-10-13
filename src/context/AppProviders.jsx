import AuthProvider from './AuthProvider'
import CartProvider from './CartProvider'
import FavoritesProvider from './FavoritesProvider'
import SavedCardsProvider from './SavedCardsProvider'
import ToastProvider from './ToastProvider'

/**
 * Contextos globales: solo lo que usan muchas pantallas a la vez.
 * Los datos de cada página (experiencias, reservas, etc.) los pide cada página en su useEffect.
 */
function AppProviders({ children }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <FavoritesProvider>
          <SavedCardsProvider>
            <CartProvider>{children}</CartProvider>
          </SavedCardsProvider>
        </FavoritesProvider>
      </AuthProvider>
    </ToastProvider>
  )
}

export default AppProviders

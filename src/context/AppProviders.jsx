import AuthProvider from './AuthProvider'
import CartProvider from './CartProvider'
import FavoritesProvider from './FavoritesProvider'
import SavedCardsProvider from './SavedCardsProvider'
import StoreProvider from './StoreProvider'
import ToastProvider from './ToastProvider'

/** Todos los contextos globales de la app, en orden de dependencia. */
function AppProviders({ children }) {
  return (
    <ToastProvider>
      <StoreProvider>
        <AuthProvider>
          <FavoritesProvider>
            <SavedCardsProvider>
              <CartProvider>{children}</CartProvider>
            </SavedCardsProvider>
          </FavoritesProvider>
        </AuthProvider>
      </StoreProvider>
    </ToastProvider>
  )
}

export default AppProviders

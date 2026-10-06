import AuthProvider from './AuthProvider'
import CartProvider from './CartProvider'
import FavoritesProvider from './FavoritesProvider'
import StoreProvider from './StoreProvider'
import ToastProvider from './ToastProvider'

/** Todos los contextos globales de la app, en orden de dependencia. */
function AppProviders({ children }) {
  return (
    <ToastProvider>
      <StoreProvider>
        <AuthProvider>
          <FavoritesProvider>
            <CartProvider>{children}</CartProvider>
          </FavoritesProvider>
        </AuthProvider>
      </StoreProvider>
    </ToastProvider>
  )
}

export default AppProviders

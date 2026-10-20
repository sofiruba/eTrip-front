import AuthProvider from './AuthProvider'
import CartProvider from './CartProvider'
import CatalogProvider from './CatalogProvider'
import CurrencyProvider from './CurrencyProvider'
import SavedCardsProvider from './SavedCardsProvider'
import ToastProvider from './ToastProvider'

/**
 * Contextos globales: solo lo que usan muchas pantallas a la vez (sesión, catálogo público, carrito…).
 * CurrencyProvider: en qué moneda se VEN los precios (se cobran siempre en pesos).
 * Los datos propios de cada página (una reserva, el panel de admin, etc.) los pide esa página en su useEffect.
 */
function AppProviders({ children }) {
  return (
    <ToastProvider>
      <CurrencyProvider>
        <CatalogProvider>
          <AuthProvider>
            <SavedCardsProvider>
              <CartProvider>{children}</CartProvider>
            </SavedCardsProvider>
          </AuthProvider>
        </CatalogProvider>
      </CurrencyProvider>
    </ToastProvider>
  )
}

export default AppProviders

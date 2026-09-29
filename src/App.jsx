import { useMemo, useState } from 'react'
import './App.css'
import { experiences } from './data/mockData'
import { Home, Detail, Cart, Checkout, Confirmation, Bookings, Orders, OrderDetail, Reviews, Profile, Host, Admin, Auth } from './screens'

function App() {
  const [screen, setScreen] = useState('home')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todas')
  const [selected, setSelected] = useState(null)
  const [cart, setCart] = useState([])
  const [toast, setToast] = useState('')
  const [auth, setAuth] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [orderDetail, setOrderDetail] = useState(false)

  const filtered = useMemo(() => experiences.filter((item) =>
    (category === 'Todas' || item.category === category) &&
    `${item.title} ${item.subtitle} ${item.location}`.toLowerCase().includes(query.toLowerCase()),
  ), [category, query])

  const notify = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  const addToCart = (item) => {
    setCart((items) => items.some((entry) => entry.id === item.id) ? items : [...items, { ...item, quantity: 1 }])
    notify('Sesión agregada a tu carrito')
  }

  const navigate = (next) => {
    setScreen(next)
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app-shell">
      <header className="navbar">
        <button className="brand" onClick={() => navigate('home')}>PLAN<span>✦</span></button>
        <div className="header-search"><span>⌕</span><input value={query} onChange={(event) => { setQuery(event.target.value); navigate('home') }} placeholder="Buscar experiencias o guías..." /></div>
        <nav className="top-nav"><button onClick={() => navigate('home')}>Explorar</button><button onClick={() => navigate('bookings')}>Mis reservas</button><button onClick={() => notify('Próximamente: experiencias guardadas')}>♡ Favoritos</button></nav>
        <div className="header-actions">
          <button className="host-link" onClick={() => navigate('host')}>Modo Anfitrión</button>
          <button className="cart-button" onClick={() => navigate('cart')} aria-label="Abrir carrito"><span>🛍 <i>Carrito</i></span><b>{cart.length}</b></button>
          <button className="profile-button" onClick={() => setMenuOpen(!menuOpen)}><span className="avatar">SR</span><span className="profile-name">Sofía</span><span>⌄</span></button>
          {menuOpen && <div className="profile-menu"><button onClick={() => navigate('profile')}>Mi perfil</button><button onClick={() => navigate('orders')}>Mis órdenes</button><button onClick={() => navigate('reviews')}>Mis reseñas</button><hr /><button onClick={() => notify('Sesión cerrada')}>Cerrar sesión</button></div>}
        </div>
      </header>

      {screen === 'home' && <Home filtered={filtered} category={category} setCategory={setCategory} onSelect={(item) => { setSelected(item); navigate('detail') }} onAuth={() => setAuth('login')} />}
      {screen === 'detail' && selected && <Detail item={selected} onBack={() => navigate('home')} onAdd={() => addToCart(selected)} onBook={() => { addToCart(selected); navigate('cart') }} />}
      {screen === 'cart' && <Cart cart={cart} onBack={() => navigate('home')} onRemove={(id) => setCart((items) => items.filter((item) => item.id !== id))} onCheckout={() => navigate('checkout')} />}
      {screen === 'checkout' && <Checkout cart={cart} onBack={() => navigate('cart')} onSuccess={() => { setCart([]); navigate('confirmation') }} />}
      {screen === 'confirmation' && <Confirmation onNavigate={navigate} />}
      {screen === 'bookings' && <Bookings onNavigate={navigate} />}
      {screen === 'orders' && !orderDetail && <Orders onNavigate={navigate} onDetail={() => setOrderDetail(true)} />}
      {screen === 'orders' && orderDetail && <OrderDetail onBack={() => setOrderDetail(false)} />}
      {screen === 'reviews' && <Reviews onNotify={notify} />}
      {screen === 'profile' && <Profile onNavigate={navigate} />}
      {screen === 'host' && <Host onNotify={notify} />}
      {screen === 'admin' && <Admin />}

      {auth && <Auth mode={auth} onClose={() => setAuth(null)} onSuccess={() => { setAuth(null); notify('¡Bienvenida a PLAN!') }} />}
      {toast && <div className="toast">✦ {toast}</div>}
      <footer><span>© 2025 PLAN</span><span>Encontrá tu próximo plan.</span><button onClick={() => navigate('admin')}>Panel interno</button></footer>
    </div>
  )
}

export default App

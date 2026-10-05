import { useMemo, useState } from 'react'
import './App.css'
import { experiences as mockExperiences } from './data/mockData'
import { Home, Detail, Cart, Checkout, Confirmation, Bookings, Orders, OrderDetail, Reviews, Profile, Host, HostBookings, Admin, Auth, ExperienceEditor, SessionManagement, CategoryManagement, UserManagement, CouponManagement, PublicProfile, VoucherDetail, ReviewForm, About, CategoryDetail, EditProfile, Refund, HostExperiences, AdminOperations, CategoryEditor, CouponEditor, UserDetail, SessionEditor, AdminRecordDetail } from './screens'

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
  const [selectedAdminScreen, setSelectedAdminScreen] = useState(null)
  const [user, setUser] = useState(null)
  const [myReviews, setMyReviews] = useState([])
  const experiences = mockExperiences
  const [adminRecord, setAdminRecord] = useState(null)
  const [editingCategory, setEditingCategory] = useState('')
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [editingSession, setEditingSession] = useState(null)
  const [adminOperation, setAdminOperation] = useState(null)

  const filtered = useMemo(() => experiences.filter((item) =>
    (category === 'Todas' || item.category === category) &&
    `${item.title} ${item.subtitle} ${item.location}`.toLowerCase().includes(query.toLowerCase()),
  ), [category, query, experiences])


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

  const openProfile = () => {
    if (!user) {
      setAuth('login')
      return
    }
    setMenuOpen(!menuOpen)
  }

  const handleAuthSuccess = (nextUser) => {
    setUser(nextUser)
    setAuth(null)
    notify(`Sesión iniciada como ${nextUser.role === 'ADMIN' ? 'administrador' : 'cliente'}`)
    navigate(nextUser.role === 'ADMIN' ? 'admin' : 'home')
  }

  return (
    <div className="app-shell">
      <header className="navbar">
        <button className="brand" onClick={() => navigate('home')}>PLAN<span>✦</span></button>
        <div className="header-search"><span>⌕</span><input value={query} onChange={(event) => { setQuery(event.target.value); navigate('home') }} placeholder="Buscar experiencias o guías..." /></div>
        <nav className="top-nav"><button onClick={() => navigate('home')}>Explorar</button><button onClick={() => navigate('bookings')}>Mis reservas</button><button onClick={() => navigate('about')}>Sobre nosotros</button><button onClick={() => notify('Próximamente: experiencias guardadas')}>♡ Favoritos</button></nav>
        <div className="header-actions">
          <button className="host-link" onClick={() => navigate('host')}>Modo Anfitrión</button>
          <button className="cart-button" onClick={() => navigate('cart')} aria-label="Abrir carrito"><span>🛍 <i>Carrito</i></span><b>{cart.length}</b></button>
          <button className="profile-button" onClick={openProfile}><span className="avatar">{user ? user.name.slice(0, 2).toUpperCase() : '?'}</span><span className="profile-name">{user ? user.name.split(' ')[0] : 'Ingresar'}</span><span>⌄</span></button>
          {menuOpen && user && <div className="profile-menu"><span className="menu-role">{user.role}</span><button onClick={() => navigate('profile')}>Mi perfil</button><button onClick={() => navigate('edit-profile')}>Editar perfil</button><button onClick={() => navigate('orders')}>Mis órdenes</button><button onClick={() => navigate('reviews')}>Mis reseñas</button><hr /><button onClick={() => { setUser(null); setMenuOpen(false); navigate('home'); notify('Sesión cerrada') }}>Cerrar sesión</button></div>}
        </div>
      </header>

      {screen === 'home' && <Home filtered={filtered} category={category} setCategory={setCategory} onSelect={(item) => { setSelected(item); navigate('detail') }} onCategory={(value) => { setCategory(value); navigate('category-detail') }} onAuth={() => setAuth('register')} />}
      {screen === 'about' && <About onNavigate={navigate} />}
      {screen === 'category-detail' && <CategoryDetail category={category} onBack={() => navigate('home')} onSelect={(item) => { setSelected(item); navigate('detail') }} />}
      {screen === 'edit-profile' && <EditProfile user={user} onBack={() => navigate('profile')} onSave={(nextUser) => { setUser(nextUser); notify('Perfil actualizado') }} />}
      {screen === 'category-editor' && <CategoryEditor category={editingCategory} onBack={() => navigate('admin')} onSave={() => notify('Categoría guardada')} />}
      {screen === 'coupon-editor' && <CouponEditor coupon={editingCoupon} onBack={() => navigate('admin')} onSave={() => notify('Cupón guardado')} />}
      {screen === 'user-detail' && <UserDetail user={adminRecord} onBack={() => navigate('admin')} onNotify={notify} />}
      {screen === 'session-editor' && <SessionEditor session={editingSession} onBack={() => navigate('session-management')} onSave={() => notify('Sesión guardada')} />}
      {screen === 'admin-record-detail' && <AdminRecordDetail type={adminOperation?.type} item={adminOperation?.item} onBack={() => { setSelectedAdminScreen(adminOperation?.type); navigate('admin') }} onNotify={notify} />}
      {screen === 'detail' && selected && <Detail item={selected} onBack={() => navigate('home')} onAdd={() => addToCart(selected)} onBook={() => { addToCart(selected); navigate('cart') }} />}
      {screen === 'cart' && <Cart cart={cart} onBack={() => navigate('home')} onRemove={(id) => setCart((items) => items.filter((item) => item.id !== id))} onCheckout={() => navigate('checkout')} />}
      {screen === 'checkout' && <Checkout cart={cart} onBack={() => navigate('cart')} onSuccess={() => { setCart([]); navigate('confirmation') }} />}
      {screen === 'confirmation' && <Confirmation onNavigate={navigate} />}
      {screen === 'bookings' && <Bookings onNavigate={navigate} />}
      {screen === 'refund' && <Refund onBack={() => navigate('bookings')} onNotify={notify} />}
      {screen === 'orders' && !orderDetail && <Orders onNavigate={navigate} onDetail={() => setOrderDetail(true)} />}
      {screen === 'orders' && orderDetail && <OrderDetail onBack={() => setOrderDetail(false)} />}
      {screen === 'reviews' && <Reviews reviews={myReviews} onNotify={notify} onWrite={() => navigate('review-form')} />}
      {screen === 'review-form' && <ReviewForm onBack={() => navigate('reviews')} onSaved={(review) => { setMyReviews((items) => [review, ...items]); notify('Reseña publicada correctamente'); navigate('reviews') }} />}
      {screen === 'profile' && <Profile user={user} reviewCount={myReviews.length || 1} bookingCount={4} interests={user?.interests} onUpdateInterests={(interests) => { setUser((current) => ({ ...current, interests })); notify('Intereses actualizados') }} onNavigate={navigate} />}
      {screen === 'host' && <Host onNotify={notify} onNavigate={navigate} />}
      {screen === 'host-experiences' && <HostExperiences onBack={() => navigate('host')} onCreate={() => navigate('experience-editor')} onEdit={() => navigate('experience-editor')} onSelect={(item) => { setSelected(item); navigate('detail') }} />}
      {screen === 'host-bookings' && <HostBookings onBack={() => navigate('host')} onNotify={notify} />}
      {screen === 'experience-editor' && <ExperienceEditor onBack={() => navigate('host')} onNotify={notify} />}
      {screen === 'session-management' && <SessionManagement onBack={() => navigate('host')} onNotify={notify} onCreate={() => { setEditingSession(null); navigate('session-editor') }} onEdit={(session) => { setEditingSession(session); navigate('session-editor') }} />}
      {screen === 'public-profile' && <PublicProfile onBack={() => navigate('home')} onSelect={(item) => { setSelected(item); navigate('detail') }} />}
      {screen === 'voucher' && <VoucherDetail onBack={() => navigate('bookings')} />}
      {screen === 'admin' && !selectedAdminScreen && <Admin onNavigate={(next) => setSelectedAdminScreen(next)} />}
      {screen === 'admin' && selectedAdminScreen === 'categories' && <CategoryManagement onBack={() => setSelectedAdminScreen(null)} onNotify={notify} onCreate={() => { setEditingCategory(''); navigate('category-editor') }} onEdit={(category) => { setEditingCategory(category); navigate('category-editor') }} />}
      {screen === 'admin' && selectedAdminScreen === 'users' && <UserManagement onBack={() => setSelectedAdminScreen(null)} onNotify={notify} onDetail={(record) => { setAdminRecord(record); navigate('user-detail') }} />}
      {screen === 'admin' && selectedAdminScreen === 'coupons' && <CouponManagement onBack={() => setSelectedAdminScreen(null)} onNotify={notify} onCreate={() => { setEditingCoupon(null); navigate('coupon-editor') }} onEdit={(coupon) => { setEditingCoupon(coupon); navigate('coupon-editor') }} />}
      {screen === 'admin' && ['orders', 'bookings', 'reviews'].includes(selectedAdminScreen) && <AdminOperations type={selectedAdminScreen} onBack={() => setSelectedAdminScreen(null)} onNotify={notify} onDetail={(item) => { setAdminOperation({ type: selectedAdminScreen, item }); navigate('admin-record-detail') }} />}

      {auth && <Auth mode={auth} onClose={() => setAuth(null)} onSuccess={handleAuthSuccess} />}
      {toast && <div className="toast">✦ {toast}</div>}
      <footer><span>© 2025 PLAN</span><span>Encontrá tu próximo plan.</span><button onClick={() => navigate('admin')}>Panel interno</button></footer>
    </div>
  )
}

export default App

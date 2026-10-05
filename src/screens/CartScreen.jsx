import EmptyState from '../components/EmptyState'
import ImageWithFallback from '../components/ImageWithFallback'
import Money from '../components/Money'

function Cart({ cart, onBack, onRemove, onCheckout }) {
  const total = cart.reduce((sum, item) => sum + item.price, 0)
  return <main className="inner-page"><button className="back-button" onClick={onBack}>← Seguir explorando</button><div className="page-title"><span className="intro-tag">CHECKOUT SEGURO</span><h1>Tu carrito de<br /><em>experiencias.</em></h1><p>Revisá tus sesiones seleccionadas antes de confirmar.</p></div>{!cart.length ? <EmptyState title="Tu carrito está vacío" text="Encontrá un plan y reservá tu lugar." action="Explorar experiencias" onClick={onBack} /> : <div className="cart-layout"><div className="cart-list">{cart.map((item) => <article className="cart-item" key={item.id}><ImageWithFallback src={item.image} alt={item.title} /><div><span className="category-label">{item.category}</span><h3>{item.title}</h3><p>{item.date}</p><p className="muted">{item.location}</p><button className="remove-button" onClick={() => onRemove(item.id)}>Eliminar</button></div><strong><Money value={item.price} /></strong></article>)}</div><aside className="summary-card"><h2>Resumen del pedido</h2><div><span>Subtotal ({cart.length} sesión)</span><strong><Money value={total} /></strong></div><div><span>Servicio PLAN</span><strong>$0</strong></div><hr /><div className="summary-total"><span>Total</span><strong><Money value={total} /></strong></div><button className="primary-button full" onClick={onCheckout}>Continuar al checkout →</button></aside></div>}</main>
}

export default Cart

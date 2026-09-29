import ImageWithFallback from '../components/ImageWithFallback'
import Money from '../components/Money'

function Checkout({ cart, onBack, onSuccess }) {
  const total = cart.reduce((sum, item) => sum + item.price, 0)
  return <main className="inner-page narrow"><button className="back-button" onClick={onBack}>← Volver al carrito</button><div className="page-title"><span className="intro-tag">PASO 2 DE 2</span><h1>Confirmá tu<br /><em>experiencia.</em></h1><p>Completá tus datos para asegurar tus lugares.</p></div><div className="checkout-layout"><div className="form-card"><h2>Datos de contacto</h2><label>Nombre completo<input placeholder="Sofía Rubachin" /></label><label>Email<input placeholder="sofia@email.com" type="email" /></label><label>Código de descuento<input placeholder="PLANFINDE10" /></label><div className="notice">♧ Tus datos están protegidos y no guardamos información de pago.</div></div><aside className="summary-card"><h2>Tu reserva</h2>{cart.map((item) => <div className="mini-item" key={item.id}><ImageWithFallback src={item.image} alt="" /><span>{item.title}<small>{item.date}</small></span><strong><Money value={item.price} /></strong></div>)}<hr /><div className="summary-total"><span>Total a pagar</span><strong><Money value={total} /></strong></div><button className="primary-button full" onClick={onSuccess}>Confirmar reserva ✦</button></aside></div></main>
}

export default Checkout

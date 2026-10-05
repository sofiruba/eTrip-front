import EmptyState from '../components/EmptyState'

function Orders({ onNavigate, onDetail }) { return <main className="inner-page"><div className="page-title"><span className="intro-tag">HISTORIAL</span><h1>Mis <em>órdenes.</em></h1><p>Consultá tus compras y comprobantes.</p></div><button className="table-card order-row" onClick={onDetail}><div><span>#ETRIP-1042</span><strong>Compra de experiencias</strong><small>26 de septiembre de 2025 · 1 reserva</small></div><b className="status">Confirmada</b><strong>$28.000</strong><span className="order-arrow">→</span></button><EmptyState title="Eso es todo por ahora" text="Tus próximas compras van a aparecer acá." action="Explorar planes" onClick={() => onNavigate('home')} /></main> }

export default Orders


function Confirmation({ onNavigate }) { return <main className="success-page"><div className="success-icon">✓</div><span className="intro-tag">RESERVA CONFIRMADA</span><h1>Tu plan ya<br /><em>es real.</em></h1><p>Te enviamos todos los detalles a tu email. Mostrá este voucher al anfitrión.</p><div className="voucher"><small>VOUCHER DE EXPERIENCIA</small><strong>ETRIP-8K4M2P</strong><span>Guardalo, lo vas a necesitar al llegar.</span></div><button className="primary-button" onClick={() => onNavigate('bookings')}>Ver mis reservas →</button></main> }

export default Confirmation

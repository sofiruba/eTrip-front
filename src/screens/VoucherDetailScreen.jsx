import { experiences } from '../data/mockData'
import ImageWithFallback from '../components/ImageWithFallback'

function VoucherDetailScreen({ onBack }) {
  return <main className="inner-page narrow"><button className="back-button" onClick={onBack}>← Volver a mis reservas</button><div className="voucher-detail"><div className="success-icon">✓</div><span className="intro-tag">VOUCHER CONFIRMADO</span><h1>Tu lugar está<br /><em>reservado.</em></h1><ImageWithFallback src={experiences[0].image} alt={experiences[0].title} /><h2>{experiences[0].title}</h2><p>◷ Sábado 26 de octubre · 16:00 hs</p><p>⌖ La Boca, CABA</p><div className="voucher-large"><small>CÓDIGO DE VOUCHER</small><strong>ETRIP-8K4M2P</strong><p>Presentá este código al anfitrión.</p></div></div></main>
}

export default VoucherDetailScreen

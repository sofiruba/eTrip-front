import { Link } from 'react-router-dom'
import Logo from './Logo'
import './Footer.css'

const YEAR = new Date().getFullYear()

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <Logo />
          <p className="muted small">Encontrá tu próximo plan.</p>
        </div>
        <nav className="footer__links" aria-label="Pie de página">
          <Link to="/">Explorar</Link>
          <Link to="/anfitrion">Ser anfitrión</Link>
          <Link to="/nosotros">Sobre nosotros</Link>
        </nav>
        <small className="muted">© {YEAR} PLAN · Buenos Aires</small>
      </div>
    </footer>
  )
}

export default Footer

import { Link } from 'react-router-dom'
import Logo from './Logo'
import './Footer.css'

const YEAR = new Date().getFullYear()

const COLUMNS = [
  {
    title: 'Explorar',
    links: [
      { to: '/', label: 'Todas las experiencias' },
      { to: '/?onlyDiscounted=true', label: 'Ofertas' },
      { to: '/nosotros', label: 'Sobre nosotros' },
    ],
  },
  {
    title: 'Anfitriones',
    links: [
      { to: '/anfitrion', label: 'Ser anfitrión' },
      { to: '/ayuda#anfitriones', label: 'Cómo publicar' },
    ],
  },
  {
    title: 'Ayuda',
    links: [
      { to: '/ayuda', label: 'Preguntas frecuentes' },
      { to: '/ayuda#cancelaciones', label: 'Cancelaciones' },
      { to: '/ayuda#pagos', label: 'Medios de pago' },
    ],
  },
  {
    title: 'Legales',
    links: [
      { to: '/terminos', label: 'Términos y condiciones' },
      { to: '/privacidad', label: 'Privacidad' },
    ],
  },
]

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <Logo />
          <p className="muted small">Encontrá tu próximo plan.</p>
        </div>
        <nav className="footer__columns" aria-label="Pie de página">
          {COLUMNS.map((column) => (
            <div key={column.title} className="footer__column">
              <h2>{column.title}</h2>
              <ul>
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="container footer__bottom">
        <small className="muted">© {YEAR} PLAN · Buenos Aires</small>
        <small className="muted">Pagás con Visa, Mastercard, American Express o billeteras virtuales.</small>
      </div>
    </footer>
  )
}

export default Footer

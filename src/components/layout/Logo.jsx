import { Sparkle } from 'lucide-react'
import { Link } from 'react-router-dom'
import './Logo.css'

function Logo() {
  return (
    <Link to="/" className="logo" aria-label="PLAN, ir al inicio">
      PLAN
      <span className="logo__mark">
        <Sparkle size={13} fill="currentColor" aria-hidden />
      </span>
    </Link>
  )
}

export default Logo

import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fullName } from '../../utils/format'
import Avatar from '../ui/Avatar'
import './HostCard.css'

function HostCard({ host }) {
  return (
    <Link to={`/anfitriones/${host.id}`} className="host-card">
      <Avatar name={fullName(host)} src={host.avatarUrl} size="lg" />
      <div>
        <span className="eyebrow">Tu anfitrión</span>
        <h3>{fullName(host)}</h3>
        <p className="muted small">{host.bio || 'Una persona local que disfruta compartir sus planes favoritos.'}</p>
      </div>
      <ArrowRight size={20} aria-hidden className="host-card__arrow" />
    </Link>
  )
}

export default HostCard

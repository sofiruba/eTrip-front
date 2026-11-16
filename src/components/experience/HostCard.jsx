import { ArrowRight, Award, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fullName } from '../../utils/format'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import './HostCard.css'

/** Tarjeta del anfitrión en el detalle: foto, bio y ciudad (del back) y la insignia "Anfitrión destacado" (calculada con el catálogo). */
function HostCard({ host, stats }) {
  return (
    <Link to={`/anfitriones/${host.id}`} className="host-card">
      <Avatar name={fullName(host)} src={host.avatarUrl} size="lg" />
      <div>
        <span className="eyebrow">Tu anfitrión</span>
        <div className="row host-card__name">
          <h3>{fullName(host)}</h3>
          {stats?.top && (
            <Badge tone="brand">
              <Award size={12} aria-hidden />
              Anfitrión destacado
            </Badge>
          )}
        </div>
        <p className="muted small">{host.bio || 'Una persona local que disfruta compartir sus planes favoritos.'}</p>
        {(host.city || stats?.reviewCount > 0) && (
          <p className="muted small host-card__meta">
            {host.city && (
              <span className="meta">
                <MapPin size={14} aria-hidden />
                {host.city}
              </span>
            )}
            {stats?.reviewCount > 0 && (
              <span>
                ★ {stats.averageRating.toFixed(1)} en {stats.reviewCount} reseñas
              </span>
            )}
          </p>
        )}
      </div>
      <ArrowRight size={20} aria-hidden className="host-card__arrow" />
    </Link>
  )
}

export default HostCard

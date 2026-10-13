import { ExternalLink, Pencil, Store } from 'lucide-react'
import { fullName } from '../../utils/format'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import AvatarUploader from './AvatarUploader'
import './ProfileHero.css'

/** Encabezado del perfil: foto, nombre, datos y accesos. */
function ProfileHero({ user, publishedCount, onEdit }) {
  const roleLabel = user.role === 'ADMIN' ? 'Administrador' : publishedCount ? 'Anfitrión' : 'Miembro'

  return (
    <section className="profile-hero">
      <AvatarUploader />
      <div className="profile-hero__info">
        <Badge tone="brand">{roleLabel}</Badge>
        <h1>{fullName(user)}</h1>
        <p className="muted">
          {user.username && <>@{user.username} · </>}
          {user.email}
          {user.city && <> · {user.city}</>}
        </p>
        {user.bio && <p>{user.bio}</p>}
      </div>
      <div className="profile-hero__actions">
        <Button variant="secondary" icon={Pencil} onClick={onEdit}>
          Editar perfil
        </Button>
        {publishedCount > 0 ? (
          <Button variant="ghost" icon={ExternalLink} to={`/anfitriones/${user.id}`}>
            Ver perfil público
          </Button>
        ) : (
          <Button variant="ghost" icon={Store} to="/anfitrion">
            Modo anfitrión
          </Button>
        )}
      </div>
    </section>
  )
}

export default ProfileHero

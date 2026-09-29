import ManagementHeader from '../components/ManagementHeader'

function UserManagementScreen({ onBack, onNotify }) {
  const users = [['Sofía Rubachin', 'sofia@email.com', 'CLIENTE'], ['Agustina V.', 'agustina@email.com', 'CLIENTE'], ['Nicolás Pérez', 'nico@email.com', 'ADMIN']]
  return <main className="inner-page"><button className="back-button" onClick={onBack}>← Volver al panel</button><ManagementHeader eyebrow="ADMINISTRACIÓN" title="Usuarios." description="Consultá perfiles y administrá roles de la plataforma." /><div className="management-list">{users.map(([name, email, role]) => <article className="management-row simple-row" key={email}><span className="avatar">{name.slice(0, 2)}</span><div><strong>{name}</strong><small>{email}</small></div><span className={`role ${role.toLowerCase()}`}>{role}</span><button className="row-action" onClick={() => onNotify(`Perfil de ${name}`)}>Ver perfil</button><button className="row-action" onClick={() => onNotify('Rol actualizado')}>Cambiar rol</button></article>)}</div></main>
}

export default UserManagementScreen

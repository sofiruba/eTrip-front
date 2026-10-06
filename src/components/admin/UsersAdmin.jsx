import { useState } from 'react'
import { Eye } from 'lucide-react'
import { findById, getUserStats } from '../../data/selectors'
import { useAuth } from '../../hooks/useAuth'
import { useStore } from '../../hooks/useStore'
import { useToast } from '../../hooks/useToast'
import { formatFullDate, fullName } from '../../utils/format'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import DataTable from '../ui/DataTable'
import IconButton from '../ui/IconButton'
import DetailDrawer from './DetailDrawer'

function UsersAdmin() {
  const { db, update } = useStore()
  const { user: currentUser } = useAuth()
  const notify = useToast()
  const [selectedId, setSelectedId] = useState(null)
  const selected = selectedId && findById(db.users, selectedId)
  const isSelf = selected?.id === currentUser.id

  const toggleRole = () => {
    const role = selected.role === 'ADMIN' ? 'CLIENTE' : 'ADMIN'
    update('users', selected.id, { role })
    notify(`${selected.firstName} ahora es ${role === 'ADMIN' ? 'administrador' : 'cliente'}`)
  }

  const toggleActive = () => {
    update('users', selected.id, { active: !selected.active })
    notify(selected.active ? 'Usuario desactivado' : 'Usuario activado', 'info')
  }

  return (
    <>
      <DataTable
        rows={db.users}
        columns={[
          {
            key: 'name',
            header: 'Usuario',
            render: (user) => (
              <div className="cell-main">
                <Avatar name={fullName(user)} size="sm" />
                <span>
                  <strong>{fullName(user)}</strong>
                  <small>{user.email}</small>
                </span>
              </div>
            ),
          },
          { key: 'role', header: 'Rol', render: (user) => <Badge tone={user.role === 'ADMIN' ? 'brand' : 'neutral'}>{user.role}</Badge> },
          {
            key: 'active',
            header: 'Estado',
            render: (user) => <Badge tone={user.active ? 'success' : 'danger'}>{user.active ? 'Activo' : 'Inactivo'}</Badge>,
          },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (user) => <IconButton icon={Eye} label="Ver detalle" variant="ghost" onClick={() => setSelectedId(user.id)} />,
          },
        ]}
      />

      {selected && (
        <DetailDrawer
          title={fullName(selected)}
          description={selected.email}
          onClose={() => setSelectedId(null)}
          fields={[
            { label: 'Usuario', value: `@${selected.username}` },
            { label: 'Rol', value: selected.role },
            { label: 'Estado', value: selected.active ? 'Activo' : 'Inactivo' },
            { label: 'Ciudad', value: selected.city },
            { label: 'Alta', value: formatFullDate(selected.joinedAt) },
            { label: 'Reservas', value: getUserStats(db, selected.id).bookings },
            { label: 'Reseñas', value: getUserStats(db, selected.id).reviews },
            { label: 'Experiencias publicadas', value: getUserStats(db, selected.id).published },
          ]}
          footer={
            isSelf ? (
              <p className="muted small">No podés cambiar tu propio rol ni desactivarte.</p>
            ) : (
              <>
                <Button variant="ghost" onClick={toggleRole}>
                  {selected.role === 'ADMIN' ? 'Quitar admin' : 'Hacer admin'}
                </Button>
                <Button variant={selected.active ? 'danger' : 'primary'} onClick={toggleActive}>
                  {selected.active ? 'Desactivar' : 'Activar'}
                </Button>
              </>
            )
          }
        />
      )}
    </>
  )
}

export default UsersAdmin

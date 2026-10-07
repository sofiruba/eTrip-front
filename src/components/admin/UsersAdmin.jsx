import { useState } from 'react'
import { ExternalLink, Eye, Users } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { findById, getUserStats } from '../../data/selectors'
import { useAuth } from '../../hooks/useAuth'
import { useStore } from '../../hooks/useStore'
import { useToast } from '../../hooks/useToast'
import { formatFullDate, fullName, normalizeText } from '../../utils/format'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import DataTable from '../ui/DataTable'
import EmptyState from '../ui/EmptyState'
import IconButton from '../ui/IconButton'
import AdminToolbar from './AdminToolbar'
import DetailDrawer from './DetailDrawer'

const ROLE_LABELS = { ADMIN: 'Admin', CLIENTE: 'Cliente' }

function UsersAdmin() {
  const { db, update } = useStore()
  // Filtro inicial desde la URL (los links de "Requiere atención" del resumen)
  const [params] = useSearchParams()
  const { user: currentUser } = useAuth()
  const notify = useToast()
  const [selectedId, setSelectedId] = useState(null)
  const [confirming, setConfirming] = useState(null) // 'role' | 'active' | null
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [state, setState] = useState(() => params.get('estado') ?? '')

  const query = normalizeText(search.trim())
  const rows = db.users
    .map((user) => ({ ...user, stats: getUserStats(db, user.id) }))
    .filter((user) => normalizeText(`${fullName(user)} ${user.email} ${user.username}`).includes(query))
    .filter((user) => !role || user.role === role)
    .filter((user) => !state || (state === 'activo' ? user.active : !user.active))

  const selected = selectedId && findById(db.users, selectedId)
  const selectedStats = selected && getUserStats(db, selected.id)
  const isSelf = selected?.id === currentUser.id
  const hostExperiences = selected ? db.experiences.filter((experience) => experience.publisherId === selected.id) : []

  const applyChange = () => {
    if (confirming === 'role') {
      const nextRole = selected.role === 'ADMIN' ? 'CLIENTE' : 'ADMIN'
      update('users', selected.id, { role: nextRole })
      notify(`${selected.firstName} ahora es ${nextRole === 'ADMIN' ? 'administrador' : 'cliente'}`)
    } else {
      update('users', selected.id, { active: !selected.active })
      notify(selected.active ? 'Cuenta desactivada: ya no puede ingresar' : 'Cuenta activada', 'info')
    }
  }

  return (
    <>
      <AdminToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar por nombre, email o usuario"
        count={`${rows.length} de ${db.users.length}`}
        filters={[
          {
            id: 'role',
            label: 'Rol',
            value: role,
            onChange: setRole,
            options: [
              { value: '', label: 'Todos los roles' },
              { value: 'CLIENTE', label: 'Clientes' },
              { value: 'ADMIN', label: 'Administradores' },
            ],
          },
          {
            id: 'state',
            label: 'Estado',
            value: state,
            onChange: setState,
            options: [
              { value: '', label: 'Todos los estados' },
              { value: 'activo', label: 'Activos' },
              { value: 'inactivo', label: 'Desactivados' },
            ],
          },
        ]}
      />

      <DataTable
        rows={rows}
        empty={<EmptyState icon={Users} title="No hay usuarios con esos filtros" />}
        columns={[
          {
            key: 'name',
            header: 'Usuario',
            sortValue: (user) => fullName(user),
            render: (user) => (
              <div className="cell-main">
                <Avatar name={fullName(user)} src={user.avatarUrl} size="sm" />
                <span>
                  <strong>{fullName(user)}</strong>
                  <small>
                    @{user.username} · {user.email}
                  </small>
                </span>
              </div>
            ),
          },
          {
            key: 'role',
            header: 'Rol',
            sortValue: (user) => user.role,
            render: (user) => <Badge tone={user.role === 'ADMIN' ? 'brand' : 'neutral'}>{ROLE_LABELS[user.role] ?? user.role}</Badge>,
          },
          { key: 'bookings', header: 'Reservas', align: 'center', sortValue: (user) => user.stats.bookings, render: (user) => user.stats.bookings },
          { key: 'published', header: 'Publicadas', align: 'center', sortValue: (user) => user.stats.published, render: (user) => user.stats.published },
          { key: 'joinedAt', header: 'Alta', sortValue: (user) => user.joinedAt, render: (user) => formatFullDate(user.joinedAt) },
          {
            key: 'active',
            header: 'Estado',
            sortValue: (user) => Number(user.active),
            render: (user) => <Badge tone={user.active ? 'success' : 'danger'}>{user.active ? 'Activo' : 'Desactivado'}</Badge>,
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
          description={`@${selected.username} · ${selected.email}`}
          onClose={() => setSelectedId(null)}
          fields={[
            { label: 'Rol', value: ROLE_LABELS[selected.role] ?? selected.role },
            { label: 'Estado', value: selected.active ? 'Activo' : 'Desactivado' },
            { label: 'Ciudad', value: selected.city || '—' },
            { label: 'Alta', value: formatFullDate(selected.joinedAt) },
            { label: 'Reservas', value: selectedStats.bookings },
            { label: 'Reseñas', value: selectedStats.reviews },
            { label: 'Experiencias publicadas', value: selectedStats.published },
          ]}
          footer={
            isSelf ? (
              <p className="muted small">No podés cambiar tu propio rol ni desactivar tu cuenta.</p>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setConfirming('role')}>
                  {selected.role === 'ADMIN' ? 'Quitar admin' : 'Hacer admin'}
                </Button>
                <Button variant={selected.active ? 'danger' : 'primary'} onClick={() => setConfirming('active')}>
                  {selected.active ? 'Desactivar cuenta' : 'Activar cuenta'}
                </Button>
              </>
            )
          }
        >
          {hostExperiences.length > 0 && (
            <>
              <h3 className="drawer-subtitle">Experiencias que publicó</h3>
              <ul className="drawer-sessions">
                {hostExperiences.map((experience) => (
                  <li key={experience.id}>
                    <Link to={`/experiencias/${experience.id}`}>{experience.title}</Link>
                    <ExternalLink size={14} aria-hidden />
                  </li>
                ))}
              </ul>
            </>
          )}
        </DetailDrawer>
      )}

      {confirming && selected && (
        <ConfirmDialog
          title={
            confirming === 'role'
              ? selected.role === 'ADMIN'
                ? '¿Quitar permisos de administrador?'
                : '¿Hacer administrador?'
              : selected.active
                ? '¿Desactivar la cuenta?'
                : '¿Activar la cuenta?'
          }
          message={
            confirming === 'role'
              ? selected.role === 'ADMIN'
                ? `${fullName(selected)} va a volver a ser cliente y pierde el acceso al panel.`
                : `${fullName(selected)} va a poder entrar al panel y gestionar todo el sitio.`
              : selected.active
                ? `${fullName(selected)} no va a poder iniciar sesión hasta que la vuelvas a activar.`
                : `${fullName(selected)} va a poder volver a iniciar sesión.`
          }
          confirmLabel="Confirmar"
          onConfirm={applyChange}
          onClose={() => setConfirming(null)}
        />
      )}
    </>
  )
}

export default UsersAdmin

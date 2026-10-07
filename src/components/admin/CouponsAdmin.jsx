import { useState } from 'react'
import { Pencil, Plus, TicketPercent, Trash2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { getCouponUsage } from '../../data/selectors'
import { useStore } from '../../hooks/useStore'
import { useToast } from '../../hooks/useToast'
import { getCouponStatus } from '../../utils/coupons'
import { formatShortDate, normalizeText } from '../../utils/format'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import DataTable from '../ui/DataTable'
import EmptyState from '../ui/EmptyState'
import IconButton from '../ui/IconButton'
import AdminToolbar from './AdminToolbar'
import CouponFormModal from './CouponFormModal'

const STATUS_OPTIONS = ['Activo', 'Programado', 'Agotado', 'Vencido', 'Inactivo']

/** Usos del cupón: "3 / 50" con barra, o "3 usos · sin límite". */
function CouponUsage({ used, max }) {
  if (max == null) {
    return (
      <span className="muted small">
        {used} {used === 1 ? 'uso' : 'usos'} · sin límite
      </span>
    )
  }
  const percent = Math.min((used / max) * 100, 100)
  return (
    <span className="usage-meter">
      <span className="usage-meter__text">
        <strong>{used}</strong> / {max}
      </span>
      <span className={`usage-meter__bar ${percent >= 100 ? 'is-full' : percent >= 80 ? 'is-high' : ''}`} aria-hidden>
        <span style={{ width: `${percent}%` }} />
      </span>
    </span>
  )
}

function CouponsAdmin() {
  const { db, remove, update } = useStore()
  // Filtro inicial desde la URL (los links de "Requiere atención" del resumen)
  const [params] = useSearchParams()
  const notify = useToast()
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(() => params.get('estado') ?? '')

  const rows = db.coupons
    .map((coupon) => {
      const used = getCouponUsage(db, coupon)
      return { ...coupon, used, status: getCouponStatus(coupon, used) }
    })
    .filter((coupon) => normalizeText(coupon.code).includes(normalizeText(search.trim())))
    .filter((coupon) => !status || coupon.status.label === status)

  // Igual que el back: si ya se usó, se desactiva en vez de borrarse (para no romper órdenes viejas)
  const confirmDelete = () => {
    if (deleting.used > 0) {
      update('coupons', deleting.id, { active: false })
      notify('El cupón ya se había usado: quedó desactivado', 'info')
    } else {
      remove('coupons', deleting.id)
      notify('Cupón eliminado', 'info')
    }
  }

  return (
    <>
      <AdminToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar por código"
        count={`${rows.length} de ${db.coupons.length}`}
        filters={[
          {
            id: 'status',
            label: 'Estado',
            value: status,
            onChange: setStatus,
            options: [{ value: '', label: 'Todos los estados' }, ...STATUS_OPTIONS.map((option) => ({ value: option, label: option }))],
          },
        ]}
      >
        <Button icon={Plus} onClick={() => setEditing('new')}>
          Nuevo cupón
        </Button>
      </AdminToolbar>

      <DataTable
        rows={rows}
        empty={<EmptyState icon={TicketPercent} title="No hay cupones con esos filtros" />}
        columns={[
          {
            key: 'code',
            header: 'Código',
            sortValue: (coupon) => coupon.code,
            render: (coupon) => (
              <div className="cell-main">
                <TicketPercent size={20} aria-hidden />
                <strong>{coupon.code}</strong>
              </div>
            ),
          },
          { key: 'percentage', header: 'Descuento', sortValue: (coupon) => coupon.percentage, render: (coupon) => `${coupon.percentage}%` },
          {
            key: 'usage',
            header: 'Usos',
            sortValue: (coupon) => coupon.used,
            render: (coupon) => <CouponUsage used={coupon.used} max={coupon.maxUses} />,
          },
          {
            key: 'validity',
            header: 'Vigencia',
            sortValue: (coupon) => coupon.validUntil,
            render: (coupon) => `${formatShortDate(coupon.validFrom)} → ${formatShortDate(coupon.validUntil)}`,
          },
          {
            key: 'status',
            header: 'Estado',
            sortValue: (coupon) => coupon.status.label,
            render: (coupon) => <Badge tone={coupon.status.tone}>{coupon.status.label}</Badge>,
          },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (coupon) => (
              <div className="cell-actions">
                <IconButton icon={Pencil} label="Editar" variant="ghost" onClick={() => setEditing(coupon)} />
                <IconButton icon={Trash2} label="Eliminar" variant="ghost" onClick={() => setDeleting(coupon)} />
              </div>
            ),
          },
        ]}
      />

      {editing && <CouponFormModal coupon={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog
          title={deleting.used > 0 ? '¿Desactivar cupón?' : '¿Eliminar cupón?'}
          message={
            deleting.used > 0
              ? `${deleting.code} ya se usó en ${deleting.used} ${deleting.used === 1 ? 'orden' : 'órdenes'}, así que se desactiva en vez de borrarse.`
              : `El código ${deleting.code} deja de existir.`
          }
          confirmLabel={deleting.used > 0 ? 'Desactivar' : 'Eliminar'}
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  )
}

export default CouponsAdmin

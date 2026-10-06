import { useState } from 'react'
import { Pencil, Plus, TicketPercent, Trash2 } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import { useToast } from '../../hooks/useToast'
import { formatShortDate, isPast } from '../../utils/format'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import DataTable from '../ui/DataTable'
import IconButton from '../ui/IconButton'
import SectionHeader from '../ui/SectionHeader'
import CouponFormModal from './CouponFormModal'

function getCouponStatus(coupon) {
  if (!coupon.active) return { label: 'Inactivo', tone: 'neutral' }
  if (isPast(coupon.validUntil)) return { label: 'Vencido', tone: 'danger' }
  if (!isPast(coupon.validFrom)) return { label: 'Programado', tone: 'warning' }
  return { label: 'Activo', tone: 'success' }
}

function CouponsAdmin() {
  const { db, remove } = useStore()
  const notify = useToast()
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  return (
    <>
      <SectionHeader title="Cupones" description="Creá promociones y controlá su vigencia.">
        <Button icon={Plus} onClick={() => setEditing('new')}>
          Nuevo cupón
        </Button>
      </SectionHeader>

      <DataTable
        rows={db.coupons}
        columns={[
          {
            key: 'code',
            header: 'Código',
            render: (coupon) => (
              <div className="cell-main">
                <TicketPercent size={20} aria-hidden />
                <strong>{coupon.code}</strong>
              </div>
            ),
          },
          { key: 'percentage', header: 'Descuento', render: (coupon) => `${coupon.percentage}%` },
          {
            key: 'validity',
            header: 'Vigencia',
            render: (coupon) => `${formatShortDate(coupon.validFrom)} → ${formatShortDate(coupon.validUntil)}`,
          },
          {
            key: 'status',
            header: 'Estado',
            render: (coupon) => {
              const status = getCouponStatus(coupon)
              return <Badge tone={status.tone}>{status.label}</Badge>
            },
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
          title="¿Eliminar cupón?"
          message={`El código ${deleting.code} deja de funcionar. Las órdenes que ya lo usaron no cambian.`}
          onConfirm={() => {
            remove('coupons', deleting.id)
            notify('Cupón eliminado', 'info')
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  )
}

export default CouponsAdmin

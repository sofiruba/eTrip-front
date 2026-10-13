import { useEffect, useState } from 'react'
import { Pencil, Plus, TicketPercent, Trash2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useToast } from '../../hooks/useToast'
import { deleteCoupon, getCoupons, updateCoupon } from '../../services/couponsService'
import { getOrders } from '../../services/ordersService'
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

const STATUS_OPTIONS = ['Activo', 'Programado', 'Vencido', 'Inactivo']

function CouponsAdmin() {
  const [coupons, setCoupons] = useState([])
  const [orders, setOrders] = useState([])
  // Filtro inicial desde la URL (los links de "Requiere atención" del resumen)
  const [params] = useSearchParams()
  const notify = useToast()
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(() => params.get('estado') ?? '')

  useEffect(() => {
    getCoupons()
      .then((data) => setCoupons(data))
      .catch((error) => notify(error.message, 'error'))

    // Para contar cuántas órdenes usaron cada cupón
    getOrders()
      .then((data) => setOrders(data))
      .catch((error) => console.error('Error al traer las órdenes:', error))
  }, [notify])

  const usesOf = (coupon) => orders.filter((order) => order.couponCode === coupon.code).length

  const rows = coupons
    .map((coupon) => ({ ...coupon, used: usesOf(coupon), status: getCouponStatus(coupon) }))
    .filter((coupon) => normalizeText(coupon.code).includes(normalizeText(search.trim())))
    .filter((coupon) => !status || coupon.status.label === status)

  const saveCoupon = (saved) =>
    setCoupons(coupons.some((item) => item.id === saved.id) ? coupons.map((item) => (item.id === saved.id ? saved : item)) : [...coupons, saved])

  // Si ya se usó, se desactiva en vez de borrarse (para no romper órdenes viejas)
  const confirmDelete = () => {
    if (deleting.used > 0) {
      const { id, code, percentage, validFrom, validUntil } = deleting
      return updateCoupon(id, { code, percentage, validFrom, validUntil, active: false })
        .then((saved) => {
          saveCoupon(saved)
          notify('El cupón ya se había usado: quedó desactivado', 'info')
        })
        .catch((error) => notify(error.message, 'error'))
    }
    return deleteCoupon(deleting.id)
      .then(() => {
        setCoupons(coupons.filter((item) => item.id !== deleting.id))
        notify('Cupón eliminado', 'info')
      })
      .catch((error) => notify(error.message, 'error'))
  }

  return (
    <>
      <AdminToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar por código"
        count={`${rows.length} de ${coupons.length}`}
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
            render: (coupon) => `${coupon.used} ${coupon.used === 1 ? 'uso' : 'usos'}`,
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

      {editing && (
        <CouponFormModal coupon={editing === 'new' ? null : editing} coupons={coupons} onSaved={saveCoupon} onClose={() => setEditing(null)} />
      )}
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

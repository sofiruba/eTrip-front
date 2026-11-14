import { useEffect, useState } from 'react'
import { Pencil, Plus, TicketPercent, Trash2 } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { deleteCoupon, fetchCoupons } from '../../redux/couponsSlice'
import { fetchOrders } from '../../redux/ordersSlice'
import { showToast } from '../../redux/toastsSlice'
import { getCouponStatus } from '../../utils/coupons'
import { formatShortDate, normalizeText } from '../../utils/format'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import DataTable from '../ui/DataTable'
import EmptyState from '../ui/EmptyState'
import ErrorState from '../ui/ErrorState'
import IconButton from '../ui/IconButton'
import Loading from '../ui/Loading'
import AdminToolbar from './AdminToolbar'
import CouponFormModal from './CouponFormModal'

const STATUS_OPTIONS = ['Activo', 'Programado', 'Vencido', 'Inactivo']

function CouponsAdmin() {
  const dispatch = useDispatch()
  const { items: coupons, loaded, error } = useSelector((state) => state.coupons)
  const orders = useSelector((state) => state.orders.items) // para contar cuántas órdenes usaron cada cupón
  // Filtro inicial desde la URL (los links de "Requiere atención" del resumen)
  const [params] = useSearchParams()
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(() => params.get('estado') ?? '')

  useEffect(() => {
    dispatch(fetchCoupons())
    dispatch(fetchOrders())
  }, [dispatch])

  const usesOf = (coupon) => orders.filter((order) => order.couponCode === coupon.code).length

  const rows = coupons
    .map((coupon) => ({ ...coupon, used: usesOf(coupon), status: getCouponStatus(coupon) }))
    .filter((coupon) => normalizeText(coupon.code).includes(normalizeText(search.trim())))
    .filter((coupon) => !status || coupon.status.label === status)

  // La regla la aplica el back: si el cupón ya se usó lo desactiva en vez de borrarlo (para no romper órdenes viejas).
  // Con la cantidad de usos, el reducer hace lo mismo en el store: lo saca de la lista o lo deja desactivado
  const confirmDelete = () =>
    dispatch(deleteCoupon({ id: deleting.id, used: deleting.used }))
      .unwrap()
      .then(() => dispatch(showToast(deleting.used > 0 ? 'El cupón ya se había usado: quedó desactivado' : 'Cupón eliminado', 'info')))
      .catch((deleteError) => dispatch(showToast(deleteError.message, 'error')))

  if (error) return <ErrorState message={error} onRetry={() => dispatch(fetchCoupons())} />
  if (!loaded) return <Loading />

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
        <CouponFormModal coupon={editing === 'new' ? null : editing} coupons={coupons} onClose={() => setEditing(null)} />
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

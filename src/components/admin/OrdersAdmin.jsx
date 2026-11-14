import { useEffect, useState } from 'react'
import { Ban, Eye, Receipt } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { cancelOrder, fetchOrders } from '../../redux/ordersSlice'
import { showToast } from '../../redux/toastsSlice'
import { fetchUsers } from '../../redux/usersSlice'
import { formatFullDate, formatMoney, fullName, normalizeText, pluralize } from '../../utils/format'
import VoucherCard from '../booking/VoucherCard'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import DataTable from '../ui/DataTable'
import EmptyState from '../ui/EmptyState'
import ErrorState from '../ui/ErrorState'
import IconButton from '../ui/IconButton'
import Loading from '../ui/Loading'
import AdminToolbar from './AdminToolbar'
import DetailModal from './DetailModal'

// Estado que calcula el back según las reservas de la orden → texto y color de la etiqueta
const ORDER_STATUS = {
  PAID: { label: 'Pagada', tone: 'success' },
  PARTIALLY_REFUNDED: { label: 'Reembolsada en parte', tone: 'warning' },
  CANCELLED: { label: 'Cancelada', tone: 'danger' },
}
const statusOf = (order) => ORDER_STATUS[order.status] ?? ORDER_STATUS.PAID

function OrdersAdmin() {
  const dispatch = useDispatch()
  // Cada orden ya trae sus reservas adentro
  const { items: orders, loaded, error } = useSelector((state) => state.orders)
  const users = useSelector((state) => state.users.items) // para mostrar el nombre de quien compró
  const [selected, setSelected] = useState(null)
  const [cancelling, setCancelling] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')

  useEffect(() => {
    dispatch(fetchOrders())
    dispatch(fetchUsers())
  }, [dispatch])

  const buyerOf = (order) => {
    const buyer = users.find((user) => user.id === order.userId)
    return buyer ? fullName(buyer) : `Usuario #${order.userId}`
  }

  const query = normalizeText(search.trim().replace('#', ''))
  const rows = orders
    .map((order) => ({ ...order, buyer: buyerOf(order), refunded: Number(order.refunded ?? 0) }))
    .filter((order) => normalizeText(`${order.id} ${order.buyer} ${order.couponCode ?? ''}`).includes(query))
    .filter((order) => {
      if (filter === 'cupon') return Boolean(order.couponCode)
      if (filter === 'reembolso') return order.refunded > 0
      return true
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  if (error) return <ErrorState message={error} onRetry={() => dispatch(fetchOrders())} />
  if (!loaded) return <Loading />

  return (
    <>
      <AdminToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar por número, cliente o cupón"
        count={`${rows.length} de ${orders.length}`}
        filters={[
          {
            id: 'filter',
            label: 'Filtrar órdenes',
            value: filter,
            onChange: setFilter,
            options: [
              { value: '', label: 'Todas las órdenes' },
              { value: 'cupon', label: 'Con cupón' },
              { value: 'reembolso', label: 'Con reembolsos' },
            ],
          },
        ]}
      />

      <DataTable
        rows={rows}
        empty={<EmptyState icon={Receipt} title="No hay órdenes con esos filtros" />}
        columns={[
          {
            key: 'id',
            header: 'Orden',
            sortValue: (order) => order.createdAt,
            render: (order) => (
              <div className="cell-main">
                <span>
                  <strong>
                    #{order.id} <Badge tone={statusOf(order).tone}>{statusOf(order).label}</Badge>
                  </strong>
                  <small>
                    {formatFullDate(order.createdAt)} · {pluralize(order.bookings.length, 'reserva')}
                  </small>
                </span>
              </div>
            ),
          },
          { key: 'buyer', header: 'Cliente', sortValue: (order) => order.buyer },
          {
            key: 'coupon',
            header: 'Cupón',
            render: (order) => (order.couponCode ? <Badge tone="brand">{order.couponCode}</Badge> : <span className="muted">—</span>),
          },
          {
            key: 'total',
            header: 'Total',
            align: 'right',
            sortValue: (order) => order.total - order.refunded,
            render: (order) => (
              <span>
                {formatMoney(order.total - order.refunded)}
                {order.refunded > 0 && <small className="muted"> ({formatMoney(order.refunded)} devuelto)</small>}
              </span>
            ),
          },
          {
            key: 'commission',
            header: 'Comisión PLAN',
            align: 'right',
            sortValue: (order) => Number(order.commission ?? 0),
            render: (order) => formatMoney(order.commission ?? 0),
          },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (order) => <IconButton icon={Eye} label="Ver detalle" variant="ghost" onClick={() => setSelected(order)} />,
          },
        ]}
      />

      {selected && (
        <DetailModal
          title={`Orden #${selected.id}`}
          description={selected.buyer}
          onClose={() => setSelected(null)}
          fields={[
            { label: 'Fecha', value: formatFullDate(selected.createdAt) },
            { label: 'Subtotal', value: formatMoney(selected.subtotal) },
            { label: 'Cupón', value: selected.couponCode ?? '—' },
            { label: 'Descuento', value: formatMoney(selected.discountAmount) },
            { label: 'Total cobrado', value: formatMoney(selected.total) },
            { label: 'Reembolsado', value: formatMoney(selected.refunded) },
            { label: 'Total neto', value: formatMoney(selected.total - selected.refunded) },
            { label: 'Estado', value: statusOf(selected).label },
          ]}
          footer={
            selected.status !== 'CANCELLED' && (
              <Button variant="danger" icon={Ban} onClick={() => setCancelling(selected)}>
                Cancelar orden
              </Button>
            )
          }
        >
          <div className="detail-cards">
            {selected.bookings.map((booking) => (
              <VoucherCard key={booking.id} booking={booking} compact />
            ))}
          </div>
        </DetailModal>
      )}
      {cancelling && (
        <ConfirmDialog
          title={`¿Cancelar la orden #${cancelling.id}?`}
          message="Se reembolsan todas sus reservas que todavía no empezaron y se liberan los lugares. Las que ya pasaron quedan como están. Cada comprador recibe un aviso."
          confirmLabel="Cancelar orden"
          // Los reducers reemplazan la orden, sus reservas y le devuelven los lugares a cada fecha
          onConfirm={() =>
            dispatch(cancelOrder(cancelling.id))
              .unwrap()
              .then(() => {
                setSelected(null)
                dispatch(showToast('Orden cancelada y reservas reembolsadas'))
              })
              .catch((cancelError) => dispatch(showToast(cancelError.message, 'error')))
          }
          onClose={() => setCancelling(null)}
        />
      )}
    </>
  )
}

export default OrdersAdmin

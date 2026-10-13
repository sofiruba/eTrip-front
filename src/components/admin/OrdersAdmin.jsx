import { useEffect, useState } from 'react'
import { Eye, Receipt } from 'lucide-react'
import { getOrders } from '../../services/ordersService'
import { getUsers } from '../../services/usersService'
import { formatFullDate, formatMoney, fullName, normalizeText, pluralize } from '../../utils/format'
import { getOrderRefunded } from '../../utils/orders'
import VoucherCard from '../booking/VoucherCard'
import Badge from '../ui/Badge'
import DataTable from '../ui/DataTable'
import EmptyState from '../ui/EmptyState'
import IconButton from '../ui/IconButton'
import AdminToolbar from './AdminToolbar'
import DetailDrawer from './DetailDrawer'

function OrdersAdmin() {
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')

  useEffect(() => {
    // Cada orden ya trae sus reservas adentro
    getOrders()
      .then((data) => setOrders(data))
      .catch((error) => console.error('Error al traer las órdenes:', error))

    // Para mostrar el nombre de quien compró
    getUsers()
      .then((data) => setUsers(data))
      .catch((error) => console.error('Error al traer los usuarios:', error))
  }, [])

  const buyerOf = (order) => {
    const buyer = users.find((user) => user.id === order.userId)
    return buyer ? fullName(buyer) : `Usuario #${order.userId}`
  }

  const query = normalizeText(search.trim().replace('#', ''))
  const rows = orders
    .map((order) => ({ ...order, buyer: buyerOf(order), refunded: getOrderRefunded(order) }))
    .filter((order) => normalizeText(`${order.id} ${order.buyer} ${order.couponCode ?? ''}`).includes(query))
    .filter((order) => {
      if (filter === 'cupon') return Boolean(order.couponCode)
      if (filter === 'reembolso') return order.refunded > 0
      return true
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

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
          { key: 'id', header: 'Orden', sortValue: (order) => order.id, render: (order) => <strong>#{order.id}</strong> },
          { key: 'buyer', header: 'Cliente', sortValue: (order) => order.buyer },
          { key: 'date', header: 'Fecha', sortValue: (order) => order.createdAt, render: (order) => formatFullDate(order.createdAt) },
          { key: 'bookings', header: 'Reservas', render: (order) => pluralize(order.bookings.length, 'reserva') },
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
            key: 'actions',
            header: '',
            align: 'right',
            render: (order) => <IconButton icon={Eye} label="Ver detalle" variant="ghost" onClick={() => setSelected(order)} />,
          },
        ]}
      />

      {selected && (
        <DetailDrawer
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
          ]}
        >
          <div className="drawer-list">
            {selected.bookings.map((booking) => (
              <VoucherCard key={booking.id} booking={booking} compact />
            ))}
          </div>
        </DetailDrawer>
      )}
    </>
  )
}

export default OrdersAdmin

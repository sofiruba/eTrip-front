import { useState } from 'react'
import { Eye } from 'lucide-react'
import { byNewest, findById, toBookingView } from '../../data/selectors'
import { useStore } from '../../hooks/useStore'
import { formatFullDate, formatMoney, fullName, pluralize } from '../../utils/format'
import VoucherCard from '../booking/VoucherCard'
import DataTable from '../ui/DataTable'
import IconButton from '../ui/IconButton'
import DetailDrawer from './DetailDrawer'

function OrdersAdmin() {
  const { db } = useStore()
  const [selected, setSelected] = useState(null)
  const orders = [...db.orders].sort(byNewest)
  const bookingsOf = (orderId) => db.bookings.filter((booking) => booking.orderId === orderId)
  const buyerOf = (order) => fullName(findById(db.users, order.userId))

  return (
    <>
      <DataTable
        rows={orders}
        columns={[
          { key: 'id', header: 'Orden', render: (order) => <strong>#{order.id}</strong> },
          { key: 'user', header: 'Cliente', render: buyerOf },
          { key: 'date', header: 'Fecha', render: (order) => formatFullDate(order.createdAt) },
          { key: 'bookings', header: 'Reservas', render: (order) => pluralize(bookingsOf(order.id).length, 'reserva') },
          { key: 'total', header: 'Total', align: 'right', render: (order) => formatMoney(order.total) },
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
          description={buyerOf(selected)}
          onClose={() => setSelected(null)}
          fields={[
            { label: 'Fecha', value: formatFullDate(selected.createdAt) },
            { label: 'Subtotal', value: formatMoney(selected.subtotal) },
            { label: 'Cupón', value: selected.couponCode ?? '—' },
            { label: 'Descuento', value: formatMoney(selected.discountAmount) },
            { label: 'Total', value: formatMoney(selected.total) },
          ]}
        >
          <div className="drawer-list">
            {bookingsOf(selected.id).map((booking) => (
              <VoucherCard key={booking.id} booking={toBookingView(db, booking)} compact />
            ))}
          </div>
        </DetailDrawer>
      )}
    </>
  )
}

export default OrdersAdmin

import { CalendarCheck, Store, Users, Wallet } from 'lucide-react'
import { byNewest, findById } from '../../data/selectors'
import { useStore } from '../../hooks/useStore'
import { formatFullDate, formatMoney, fullName, isPast } from '../../utils/format'
import DataTable from '../ui/DataTable'
import SectionHeader from '../ui/SectionHeader'
import StatCard from '../ui/StatCard'

const RECENT_ORDERS = 5

function AdminOverview() {
  const { db } = useStore()
  const activeBookings = db.bookings.filter((booking) => !booking.refunded && !isPast(booking.startsAt))
  const sales = db.orders.reduce((sum, order) => sum + order.total, 0)
  const recentOrders = [...db.orders].sort(byNewest).slice(0, RECENT_ORDERS)

  return (
    <div className="stack">
      <div className="stat-grid">
        <StatCard icon={Users} label="Usuarios activos" value={db.users.filter((user) => user.active).length} />
        <StatCard icon={Store} label="Experiencias" value={db.experiences.length} />
        <StatCard icon={CalendarCheck} label="Reservas próximas" value={activeBookings.length} />
        <StatCard icon={Wallet} label="Ventas acumuladas" value={formatMoney(sales)} />
      </div>

      <section className="section">
        <SectionHeader title="Últimas órdenes" />
        <DataTable
          rows={recentOrders}
          columns={[
            { key: 'id', header: 'Orden', render: (order) => <strong>#{order.id}</strong> },
            { key: 'user', header: 'Cliente', render: (order) => fullName(findById(db.users, order.userId)) },
            { key: 'date', header: 'Fecha', render: (order) => formatFullDate(order.createdAt) },
            { key: 'total', header: 'Total', align: 'right', render: (order) => formatMoney(order.total) },
          ]}
        />
      </section>
    </div>
  )
}

export default AdminOverview

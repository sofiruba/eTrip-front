import { useState } from 'react'
import { CalendarCheck } from 'lucide-react'
import { getBookings } from '../../data/selectors'
import { useStore } from '../../hooks/useStore'
import { useToast } from '../../hooks/useToast'
import { formatSessionDate, normalizeText } from '../../utils/format'
import { getBookingStatus } from '../booking/bookingStatus'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import DataTable from '../ui/DataTable'
import EmptyState from '../ui/EmptyState'
import AdminToolbar from './AdminToolbar'

const STATUS_FILTERS = [
  { value: '', label: 'Todas las reservas' },
  { value: 'Confirmada', label: 'Próximas' },
  { value: 'Finalizada', label: 'Finalizadas' },
  { value: 'Reembolsada', label: 'Reembolsadas' },
]

function BookingsAdmin() {
  const { db, refundBooking } = useStore()
  const notify = useToast()
  const [refunding, setRefunding] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const query = normalizeText(search.trim())
  const all = getBookings(db).reverse()
  const rows = all
    .map((booking) => ({ ...booking, status: getBookingStatus(booking) }))
    .filter((booking) => normalizeText(`${booking.experienceTitle} ${booking.buyerName} ${booking.voucherCode}`).includes(query))
    .filter((booking) => !status || booking.status.label === status)

  return (
    <>
      <AdminToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar por experiencia, cliente o voucher"
        count={`${rows.length} de ${all.length}`}
        filters={[{ id: 'status', label: 'Estado', value: status, onChange: setStatus, options: STATUS_FILTERS }]}
      />

      <DataTable
        rows={rows}
        empty={<EmptyState icon={CalendarCheck} title="No hay reservas con esos filtros" />}
        columns={[
          {
            key: 'experience',
            header: 'Reserva',
            sortValue: (booking) => booking.experienceTitle,
            render: (booking) => (
              <div className="cell-main">
                <span>
                  <strong>{booking.experienceTitle}</strong>
                  <small>{booking.voucherCode}</small>
                </span>
              </div>
            ),
          },
          { key: 'buyerName', header: 'Cliente', sortValue: (booking) => booking.buyerName },
          { key: 'date', header: 'Fecha', sortValue: (booking) => booking.startsAt, render: (booking) => formatSessionDate(booking.startsAt) },
          { key: 'quantity', header: 'Personas', align: 'center', sortValue: (booking) => booking.quantity },
          {
            key: 'status',
            header: 'Estado',
            sortValue: (booking) => booking.status.label,
            render: (booking) => <Badge tone={booking.status.tone}>{booking.status.label}</Badge>,
          },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (booking) =>
              !booking.isPast && !booking.refunded ? (
                <Button size="sm" variant="danger" onClick={() => setRefunding(booking)}>
                  Reembolsar
                </Button>
              ) : null,
          },
        ]}
      />

      {refunding && (
        <ConfirmDialog
          title="¿Reembolsar reserva?"
          message={`Se anula el voucher ${refunding.voucherCode} de ${refunding.buyerName} y se liberan los lugares. Como administrador podés reembolsar aunque falten menos de 48 h.`}
          confirmLabel="Reembolsar"
          onConfirm={() => {
            refundBooking(refunding.id)
            notify('Reserva reembolsada')
          }}
          onClose={() => setRefunding(null)}
        />
      )}
    </>
  )
}

export default BookingsAdmin

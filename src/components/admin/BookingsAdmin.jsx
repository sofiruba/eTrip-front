import { useEffect, useState } from 'react'
import { CalendarCheck } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchBookings, refundBooking } from '../../redux/bookingsSlice'
import { showToast } from '../../redux/toastsSlice'
import { addBookingInfo, getBookingStatus } from '../../utils/bookings'
import { formatSessionDate, normalizeText } from '../../utils/format'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import DataTable from '../ui/DataTable'
import EmptyState from '../ui/EmptyState'
import ErrorState from '../ui/ErrorState'
import Loading from '../ui/Loading'
import AdminToolbar from './AdminToolbar'

const STATUS_FILTERS = [
  { value: '', label: 'Todas las reservas' },
  { value: 'Confirmada', label: 'Próximas' },
  { value: 'Finalizada', label: 'Finalizadas' },
  { value: 'Reembolsada', label: 'Reembolsadas' },
]

function BookingsAdmin() {
  const dispatch = useDispatch()
  // Como admin, el slice de reservas tiene las de todo el sitio
  const { items: bookings, loaded, error } = useSelector((state) => state.bookings)
  const [refunding, setRefunding] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (!loaded) dispatch(fetchBookings())
  }, [loaded, dispatch])

  const query = normalizeText(search.trim())
  const all = addBookingInfo(bookings).reverse()
  const rows = all
    .map((booking) => ({ ...booking, status: getBookingStatus(booking) }))
    .filter((booking) => normalizeText(`${booking.experienceTitle} ${booking.buyerName} ${booking.voucherCode}`).includes(query))
    .filter((booking) => !status || booking.status.label === status)

  if (error) return <ErrorState message={error} onRetry={() => dispatch(fetchBookings())} />
  if (!loaded) return <Loading />

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
              booking.refundable ? (
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
          message={`Se anula el voucher ${refunding.voucherCode} de ${refunding.buyerName}, se le devuelve el dinero y se liberan los lugares.`}
          confirmLabel="Reembolsar"
          onConfirm={() =>
            dispatch(refundBooking(refunding.id))
              .then((action) => {
                if (action.error) {
                  return dispatch(showToast({ message: action.error.message, tone: 'error' }))
                }
                return dispatch(showToast({ message: 'Reserva reembolsada: los lugares vuelven a estar disponibles' }))
              })
          }
          onClose={() => setRefunding(null)}
        />
      )}
    </>
  )
}

export default BookingsAdmin

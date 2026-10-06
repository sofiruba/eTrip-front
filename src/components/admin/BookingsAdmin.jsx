import { useState } from 'react'
import { useStore } from '../../hooks/useStore'
import { useToast } from '../../hooks/useToast'
import { formatSessionDate } from '../../utils/format'
import { getBookingStatus } from '../booking/bookingStatus'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import DataTable from '../ui/DataTable'
import { getBookings } from '../../data/selectors'

function BookingsAdmin() {
  const { db, refundBooking } = useStore()
  const notify = useToast()
  const [refunding, setRefunding] = useState(null)
  const bookings = getBookings(db).reverse()

  return (
    <>
      <DataTable
        rows={bookings}
        columns={[
          {
            key: 'experience',
            header: 'Reserva',
            render: (booking) => (
              <div className="cell-main">
                <span>
                  <strong>{booking.experienceTitle}</strong>
                  <small>{booking.voucherCode}</small>
                </span>
              </div>
            ),
          },
          { key: 'buyerName', header: 'Cliente' },
          { key: 'date', header: 'Fecha', render: (booking) => formatSessionDate(booking.startsAt) },
          { key: 'quantity', header: 'Personas', align: 'center' },
          {
            key: 'status',
            header: 'Estado',
            render: (booking) => {
              const status = getBookingStatus(booking)
              return <Badge tone={status.tone}>{status.label}</Badge>
            },
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
          message={`Se anula el voucher ${refunding.voucherCode} de ${refunding.buyerName} y se liberan los lugares.`}
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

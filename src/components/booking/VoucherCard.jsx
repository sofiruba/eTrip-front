import { Ticket } from 'lucide-react'
import { pluralize } from '../../utils/format'
import './VoucherCard.css'

function VoucherCard({ booking, compact = false }) {
  return (
    <div className={`voucher ${compact ? 'voucher--compact' : ''} ${booking.refunded ? 'is-void' : ''}`}>
      <Ticket size={compact ? 20 : 28} aria-hidden className="voucher__icon" />
      <div>
        <span className="eyebrow">{compact ? booking.experienceTitle : 'Código de voucher'}</span>
        <strong className="voucher__code">{booking.voucherCode}</strong>
        {!compact && (
          <p className="muted small">
            {booking.refunded
              ? 'Este voucher fue anulado por el reembolso.'
              : `Válido para ${pluralize(booking.quantity, 'persona')}. Mostralo al anfitrión al llegar.`}
          </p>
        )}
      </div>
    </div>
  )
}

export default VoucherCard

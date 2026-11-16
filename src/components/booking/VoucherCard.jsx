import { Gift, Ticket } from 'lucide-react'
import { pluralize } from '../../utils/format'
import './VoucherCard.css'

function VoucherCard({ booking, compact = false }) {
  return (
    <div className={`voucher ${compact ? 'voucher--compact' : ''} ${booking.refunded ? 'is-void' : ''}`}>
      <Ticket size={compact ? 20 : 28} aria-hidden className="voucher__icon" />
      <div>
        <span className="eyebrow">{compact ? booking.experienceTitle : 'Código de voucher'}</span>
        {booking.voucherCode ? (
          <strong className="voucher__code">{booking.voucherCode}</strong>
        ) : (
          // Regalo ya entregado: el voucher es de quien lo recibió y el back no le manda el código a quien pagó
          <strong className="voucher__code voucher__code--hidden">Lo tiene {booking.giftRecipientName}</strong>
        )}
        {!compact && (
          <p className="muted small">
            {booking.refunded
              ? 'Este voucher fue anulado por el reembolso.'
              : booking.voucherCode
                ? `Válido para ${pluralize(booking.quantity, 'persona')}. Mostralo al anfitrión al llegar.`
                : `Ya está en las reservas de ${booking.giftRecipientName}: el voucher es suyo.`}
          </p>
        )}
        {/* Regalo: quién lo regala y para quién (viene en la reserva, lo arma el back con la orden) */}
        {booking.giftRecipientName && (
          <p className="voucher__gift">
            <Gift size={16} aria-hidden />
            <span>
              Regalo de <strong>{booking.giftFromName}</strong> para <strong>{booking.giftRecipientName}</strong>
              {booking.giftMessage && <q>{booking.giftMessage}</q>}
            </span>
          </p>
        )}
      </div>
    </div>
  )
}

export default VoucherCard

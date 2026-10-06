import { formatMoney } from '../../utils/format'
import CheckoutItem from './CheckoutItem'
import CouponField from './CouponField'
import './CheckoutSummary.css'

/** Columna derecha del checkout. Con más de 2 experiencias, cada una se puede plegar. */
function CheckoutSummary({ lines, subtotal, discount, coupon, onApplyCoupon, onRemoveCoupon, onQuantityChange }) {
  const collapsible = lines.length > 2

  return (
    <aside className="checkout-summary" aria-label="Resumen de la compra">
      <div className="checkout-summary__items">
        {lines.map((line) => (
          <CheckoutItem
            key={line.sessionId}
            line={line}
            collapsible={collapsible}
            onQuantityChange={(quantity) => onQuantityChange(line.sessionId, quantity)}
          />
        ))}
      </div>

      <div className="checkout-summary__coupon">
        <CouponField coupon={coupon} onApply={onApplyCoupon} onRemove={onRemoveCoupon} />
      </div>

      <dl className="checkout-summary__totals">
        {(discount > 0 || lines.length > 1) && (
          <div>
            <dt>Subtotal</dt>
            <dd>{formatMoney(subtotal)}</dd>
          </div>
        )}
        {discount > 0 && (
          <div className="checkout-summary__discount">
            <dt>Cupón {coupon.code}</dt>
            <dd>−{formatMoney(discount)}</dd>
          </div>
        )}
        <div className="checkout-summary__total">
          <dt>
            Total <abbr title="Pesos argentinos">ARS</abbr>
          </dt>
          <dd>{formatMoney(subtotal - discount)}</dd>
        </div>
      </dl>
    </aside>
  )
}

export default CheckoutSummary

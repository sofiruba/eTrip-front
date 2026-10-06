import { formatMoney } from '../../utils/format'
import './OrderSummary.css'

/**
 * Resumen de importes reutilizado en carrito, checkout y detalle de reserva.
 * items: [{ id, label, detail, amount }]
 */
function OrderSummary({ title = 'Resumen', items, discount = 0, couponCode, totalLabel = 'Total', children }) {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)

  return (
    <aside className="order-summary card">
      <h2>{title}</h2>
      <ul className="order-summary__items">
        {items.map((item) => (
          <li key={item.id}>
            <span>
              {item.label}
              {item.detail && <small>{item.detail}</small>}
            </span>
            <strong>{formatMoney(item.amount)}</strong>
          </li>
        ))}
      </ul>
      <dl className="order-summary__totals">
        {discount > 0 && (
          <>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatMoney(subtotal)}</dd>
            </div>
            <div className="order-summary__discount">
              <dt>Cupón {couponCode}</dt>
              <dd>-{formatMoney(discount)}</dd>
            </div>
          </>
        )}
        <div className="order-summary__total">
          <dt>{totalLabel}</dt>
          <dd>{formatMoney(subtotal - discount)}</dd>
        </div>
      </dl>
      {children && <div className="order-summary__actions">{children}</div>}
    </aside>
  )
}

export default OrderSummary

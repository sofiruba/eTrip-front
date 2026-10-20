import Modal from '../ui/Modal'
import './DetailModal.css'

/** Modal con el detalle de un registro del panel. fields: [{ label, value }] */
function DetailModal({ title, description, fields, footer, children, onClose }) {
  return (
    <Modal size="lg" title={title} description={description} footer={footer} onClose={onClose}>
      <dl className="detail-fields">
        {fields.map(({ label, value }) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {children}
    </Modal>
  )
}

export default DetailModal

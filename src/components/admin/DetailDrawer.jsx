import Modal from '../ui/Modal'
import './DetailDrawer.css'

/** Panel lateral con el detalle de un registro. fields: [{ label, value }] */
function DetailDrawer({ title, description, fields, footer, children, onClose }) {
  return (
    <Modal variant="drawer" title={title} description={description} footer={footer} onClose={onClose}>
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

export default DetailDrawer

import Button from './Button'
import Modal from './Modal'

/** Confirmación para acciones destructivas. */
function ConfirmDialog({ title, message, confirmLabel = 'Eliminar', onConfirm, onClose }) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="muted">{message}</p>
    </Modal>
  )
}

export default ConfirmDialog

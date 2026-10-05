function FormField({ label, as = 'input', children, ...props }) {
  const Field = as
  return <label className="form-field">{label}{children || <Field {...props} />}</label>
}

function FormActions({ onCancel, cancelLabel = 'Cancelar', submitLabel = 'Guardar cambios →' }) {
  return <div className="form-actions"><button type="button" className="outline-button" onClick={onCancel}>{cancelLabel}</button><button className="primary-button">{submitLabel}</button></div>
}

export { FormActions }
export default FormField

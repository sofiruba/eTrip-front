import './Loading.css'

/** Mientras esperamos la respuesta del back. */
function Loading({ text = 'Cargando...' }) {
  return (
    <div className="loading" role="status">
      <span className="loading__spinner" aria-hidden />
      <span>{text}</span>
    </div>
  )
}

export default Loading

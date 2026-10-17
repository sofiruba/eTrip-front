import { ServerCrash } from 'lucide-react'
import Button from './Button'
import EmptyState from './EmptyState'

/**
 * Cuando el back no respondió o respondió con un error (razón de rechazo de la promesa).
 * Se distingue de "no hay datos": muestra el motivo, un botón para volver a intentar (si hay `onRetry`)
 * y otras acciones que se pasen como children.
 */
function ErrorState({ title = 'No pudimos cargar esta sección', message, onRetry, children }) {
  return (
    <EmptyState icon={ServerCrash} title={title} text={message}>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Reintentar
        </Button>
      )}
      {children}
    </EmptyState>
  )
}

export default ErrorState

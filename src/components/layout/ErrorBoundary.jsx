import { Component } from 'react'
import { TriangleAlert } from 'lucide-react'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'

/**
 * Si una página rompe al renderizar, muestra un aviso en vez de dejar la pantalla en blanco.
 * El layout lo monta con key={pathname}, así al navegar a otra página se resetea solo.
 */
class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Error en la página:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="container page page--narrow">
        <EmptyState icon={TriangleAlert} title="Algo salió mal" text="Tuvimos un problema al mostrar esta página. Probá de nuevo en un rato.">
          <Button onClick={() => this.setState({ error: null })}>Reintentar</Button>
          <Button variant="secondary" to="/">
            Volver al inicio
          </Button>
        </EmptyState>
      </div>
    )
  }
}

export default ErrorBoundary

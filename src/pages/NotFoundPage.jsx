import { Compass } from 'lucide-react'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'

function NotFoundPage({ title = 'No encontramos esta página', text = 'Puede que el link esté roto o que la página ya no exista.' }) {
  return (
    <div className="container page page--narrow">
      <EmptyState icon={Compass} title={title} text={text}>
        <Button to="/">Volver a explorar</Button>
      </EmptyState>
    </div>
  )
}

export default NotFoundPage

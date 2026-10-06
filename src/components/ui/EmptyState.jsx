import { Sparkles } from 'lucide-react'
import './EmptyState.css'

function EmptyState({ icon: Icon = Sparkles, title, text, children }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">
        <Icon size={24} aria-hidden />
      </span>
      <h3>{title}</h3>
      {text && <p className="muted">{text}</p>}
      {children && <div className="empty-state__actions">{children}</div>}
    </div>
  )
}

export default EmptyState

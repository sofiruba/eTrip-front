import { CircleAlert, Info, TriangleAlert } from 'lucide-react'
import './Notice.css'

const ICONS = { info: Info, warning: TriangleAlert, danger: CircleAlert }

/** Aviso en línea. tone: info | warning | danger */
function Notice({ tone = 'info', children, action }) {
  const Icon = ICONS[tone]
  return (
    <div className={`notice notice--${tone}`} role={tone === 'info' ? 'note' : 'alert'}>
      <Icon size={18} aria-hidden />
      <div className="notice__text">{children}</div>
      {action}
    </div>
  )
}

export default Notice

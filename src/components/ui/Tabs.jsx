import { NavLink } from 'react-router-dom'
import './Tabs.css'

/**
 * Pestañas. Cada item puede navegar (`to`) o avisar con onChange(id).
 * orientation="vertical" se usa como sidebar en los paneles.
 */
function Tabs({ items, value, onChange, orientation = 'horizontal', label }) {
  return (
    <nav className={`tabs tabs--${orientation}`} aria-label={label}>
      {items.map(({ id, label: itemLabel, icon: Icon, count, to }) => {
        const content = (
          <>
            {Icon && <Icon size={18} aria-hidden />}
            <span>{itemLabel}</span>
            {count !== undefined && <span className="tabs__count">{count}</span>}
          </>
        )
        return to ? (
          <NavLink key={id} to={to} end className={({ isActive }) => `tabs__item ${isActive ? 'is-active' : ''}`}>
            {content}
          </NavLink>
        ) : (
          <button
            key={id}
            type="button"
            className={`tabs__item ${value === id ? 'is-active' : ''}`}
            aria-pressed={value === id}
            onClick={() => onChange(id)}
          >
            {content}
          </button>
        )
      })}
    </nav>
  )
}

export default Tabs

import { Search } from 'lucide-react'
import './AdminToolbar.css'

/**
 * Barra arriba de cada tabla del panel: buscador, filtros (selects) y contador.
 * filters: [{ id, label, value, options: [{ value, label }], onChange(value) }]
 */
function AdminToolbar({ search, onSearch, placeholder = 'Buscar…', filters = [], count, children }) {
  return (
    <div className="admin-toolbar">
      <label className="admin-toolbar__search">
        <Search size={16} aria-hidden />
        <input type="search" value={search} placeholder={placeholder} aria-label={placeholder} onChange={(event) => onSearch(event.target.value)} />
      </label>
      {filters.map((filter) => (
        <select
          key={filter.id}
          className="admin-toolbar__select"
          aria-label={filter.label}
          value={filter.value}
          onChange={(event) => filter.onChange(event.target.value)}
        >
          {filter.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}
      {count !== undefined && <span className="admin-toolbar__count muted small">{count}</span>}
      {children && <div className="admin-toolbar__actions">{children}</div>}
    </div>
  )
}

export default AdminToolbar

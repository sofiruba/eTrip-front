import { useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import './DataTable.css'

const compare = (a, b) => {
  if (a == null) return 1
  if (b == null) return -1
  return typeof a === 'string' ? a.localeCompare(b, 'es') : a - b
}

/**
 * Tabla genérica para los paneles. En mobile se ve como tarjetas.
 * columns: [{ key, header, render?(row), align?, sortValue?(row) }]: con `sortValue`
 * el encabezado ordena al tocarlo (asc → desc → sin orden).
 * pageSize: filas por página (0 = todas).
 */
function DataTable({ columns, rows, rowKey = 'id', empty, pageSize = 10 }) {
  const [sort, setSort] = useState(null) // { key, dir: 1 | -1 }
  const [page, setPage] = useState(0)

  if (!rows.length) return empty ?? null

  const sortColumn = sort && columns.find((column) => column.key === sort.key)
  const sorted = sortColumn
    ? [...rows].sort((a, b) => compare(sortColumn.sortValue(a), sortColumn.sortValue(b)) * sort.dir)
    : rows
  const pages = pageSize ? Math.ceil(sorted.length / pageSize) : 1
  // Si cambian los filtros y quedan menos filas, no quedarse en una página vacía
  const current = Math.min(page, pages - 1)
  const visible = pageSize ? sorted.slice(current * pageSize, (current + 1) * pageSize) : sorted

  const toggleSort = (key) =>
    setSort((previous) => {
      if (previous?.key !== key) return { key, dir: 1 }
      return previous.dir === 1 ? { key, dir: -1 } : null
    })

  return (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            {columns.map((column) => {
              const active = sort?.key === column.key
              const SortIcon = !active ? ArrowUpDown : sort.dir === 1 ? ArrowUp : ArrowDown
              return (
                <th
                  key={column.key}
                  style={{ textAlign: column.align }}
                  aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}
                >
                  {column.sortValue ? (
                    <button type="button" className={`data-table__sort ${active ? 'is-active' : ''}`} onClick={() => toggleSort(column.key)}>
                      {column.header}
                      <SortIcon size={13} aria-hidden />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr key={row[rowKey]}>
              {columns.map((column) => (
                <td key={column.key} data-label={column.header} style={{ textAlign: column.align }}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {pages > 1 && (
        <div className="data-table__pagination">
          <span className="muted small">
            {current * pageSize + 1}–{Math.min((current + 1) * pageSize, sorted.length)} de {sorted.length}
          </span>
          <div className="cell-actions">
            <button type="button" aria-label="Página anterior" disabled={current === 0} onClick={() => setPage(current - 1)}>
              <ChevronLeft size={16} aria-hidden />
            </button>
            <button type="button" aria-label="Página siguiente" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
              <ChevronRight size={16} aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable

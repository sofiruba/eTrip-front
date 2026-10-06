import './DataTable.css'

/**
 * Tabla genérica para los paneles.
 * columns: [{ key, header, render?(row), align? }]. En mobile se ve como tarjetas.
 */
function DataTable({ columns, rows, rowKey = 'id', empty }) {
  if (!rows.length) return empty ?? null

  return (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={{ textAlign: column.align }}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
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
    </div>
  )
}

export default DataTable

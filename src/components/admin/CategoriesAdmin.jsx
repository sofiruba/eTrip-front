import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import { useToast } from '../../hooks/useToast'
import { normalizeText, pluralize } from '../../utils/format'
import { getCategoryIcon } from '../experience/categoryIcons'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import DataTable from '../ui/DataTable'
import IconButton from '../ui/IconButton'
import AdminToolbar from './AdminToolbar'
import CategoryFormModal from './CategoryFormModal'

function CategoriesAdmin() {
  const { db, remove } = useStore()
  const notify = useToast()
  const [editing, setEditing] = useState(null) // categoría, 'new' o null
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch] = useState('')

  const usage = (categoryId) => db.experiences.filter((experience) => experience.categoryId === categoryId).length

  const rows = db.categories.filter((category) =>
    normalizeText(`${category.name} ${category.description ?? ''}`).includes(normalizeText(search.trim())),
  )

  const askDelete = (category) => {
    if (usage(category.id)) return notify('No se puede eliminar: tiene experiencias asociadas.', 'error')
    return setDeleting(category)
  }

  return (
    <>
      <AdminToolbar search={search} onSearch={setSearch} placeholder="Buscar categoría" count={`${rows.length} de ${db.categories.length}`}>
        <Button icon={Plus} onClick={() => setEditing('new')}>
          Nueva categoría
        </Button>
      </AdminToolbar>

      <DataTable
        rows={rows}
        columns={[
          {
            key: 'name',
            header: 'Categoría',
            sortValue: (category) => category.name,
            render: (category) => {
              const Icon = getCategoryIcon(category.name)
              return (
                <div className="cell-main">
                  <Icon size={20} aria-hidden />
                  <span>
                    <strong>{category.name}</strong>
                    <small>{category.description}</small>
                  </span>
                </div>
              )
            },
          },
          { key: 'usage', header: 'Experiencias', sortValue: (category) => usage(category.id), render: (category) => pluralize(usage(category.id), 'experiencia') },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (category) => (
              <div className="cell-actions">
                <IconButton icon={Pencil} label="Editar" variant="ghost" onClick={() => setEditing(category)} />
                <IconButton icon={Trash2} label="Eliminar" variant="ghost" onClick={() => askDelete(category)} />
              </div>
            ),
          },
        ]}
      />

      {editing && <CategoryFormModal category={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog
          title="¿Eliminar categoría?"
          message={`Vas a eliminar “${deleting.name}”.`}
          onConfirm={() => {
            remove('categories', deleting.id)
            notify('Categoría eliminada', 'info')
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  )
}

export default CategoriesAdmin

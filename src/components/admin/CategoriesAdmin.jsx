import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import { deleteCategory, getCategories } from '../../services/categoriesService'
import { getAllExperiences } from '../../services/experiencesService'
import { normalizeText, pluralize } from '../../utils/format'
import { getCategoryIcon } from '../experience/categoryIcons'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import DataTable from '../ui/DataTable'
import IconButton from '../ui/IconButton'
import AdminToolbar from './AdminToolbar'
import CategoryFormModal from './CategoryFormModal'

function CategoriesAdmin() {
  const [categories, setCategories] = useState([])
  const [experiences, setExperiences] = useState([])
  const notify = useToast()
  const [editing, setEditing] = useState(null) // categoría, 'new' o null
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data))
      .catch((error) => notify(error.message, 'error'))

    // Para saber cuántas experiencias usa cada categoría
    getAllExperiences()
      .then((data) => setExperiences(data))
      .catch((error) => console.error('Error al traer las experiencias:', error))
  }, [notify])

  const usage = (categoryId) => experiences.filter((experience) => experience.categoryId === categoryId).length

  const rows = categories.filter((category) =>
    normalizeText(`${category.name} ${category.description ?? ''}`).includes(normalizeText(search.trim())),
  )

  const askDelete = (category) => {
    if (usage(category.id)) return notify('No se puede eliminar: tiene experiencias asociadas.', 'error')
    return setDeleting(category)
  }

  return (
    <>
      <AdminToolbar search={search} onSearch={setSearch} placeholder="Buscar categoría" count={`${rows.length} de ${categories.length}`}>
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

      {editing && (
        <CategoryFormModal
          category={editing === 'new' ? null : editing}
          categories={categories}
          onSaved={(saved) =>
            setCategories(
              categories.some((item) => item.id === saved.id)
                ? categories.map((item) => (item.id === saved.id ? saved : item))
                : [...categories, saved],
            )
          }
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="¿Eliminar categoría?"
          message={`Vas a eliminar “${deleting.name}”.`}
          onConfirm={() =>
            deleteCategory(deleting.id)
              .then(() => {
                setCategories(categories.filter((item) => item.id !== deleting.id))
                notify('Categoría eliminada', 'info')
              })
              .catch((error) => notify(error.message, 'error'))
          }
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  )
}

export default CategoriesAdmin

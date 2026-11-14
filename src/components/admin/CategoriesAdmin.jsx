import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { deleteCategory, fetchCategories } from '../../redux/categoriesSlice'
import { fetchManagedExperiences } from '../../redux/experiencesSlice'
import { showToast } from '../../redux/toastsSlice'
import { normalizeText, pluralize } from '../../utils/format'
import { getCategoryIcon } from '../experience/categoryIcons'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import DataTable from '../ui/DataTable'
import IconButton from '../ui/IconButton'
import AdminToolbar from './AdminToolbar'
import CategoryFormModal from './CategoryFormModal'

function CategoriesAdmin() {
  const dispatch = useDispatch()
  // Las categorías ya están en el store (se pidieron al abrir la app): son las mismas que ve el catálogo público
  const categories = useSelector((state) => state.categories.items)
  // Para saber cuántas experiencias usa cada categoría (todas, también las pausadas)
  const experiences = useSelector((state) => state.experiences.managed.items)
  const [editing, setEditing] = useState(null) // categoría, 'new' o null
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    dispatch(fetchCategories())
    dispatch(fetchManagedExperiences())
  }, [dispatch])

  const usage = (categoryId) => experiences.filter((experience) => experience.categoryId === categoryId).length

  const rows = categories.filter((category) =>
    normalizeText(`${category.name} ${category.description ?? ''}`).includes(normalizeText(search.trim())),
  )

  const askDelete = (category) => {
    if (usage(category.id)) return dispatch(showToast('No se puede eliminar: tiene experiencias asociadas.', 'error'))
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
        <CategoryFormModal category={editing === 'new' ? null : editing} categories={categories} onClose={() => setEditing(null)} />
      )}
      {deleting && (
        <ConfirmDialog
          title="¿Eliminar categoría?"
          message={`Vas a eliminar “${deleting.name}”.`}
          onConfirm={() =>
            dispatch(deleteCategory(deleting.id))
              .unwrap()
              .then(() => dispatch(showToast('Categoría eliminada', 'info')))
              .catch((error) => dispatch(showToast(error.message, 'error')))
          }
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  )
}

export default CategoriesAdmin

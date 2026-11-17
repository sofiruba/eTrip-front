import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { deleteCategory, fetchCategories } from '../../redux/categoriesSlice'
import { isMissing } from '../../redux/helpers'
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
  const categoriesState = useSelector((state) => state.categories)
  const categories = categoriesState.items
  const [editing, setEditing] = useState(null) // categoría, 'new' o null
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch] = useState('')

  // Ya se pidieron al abrir la app; esto cubre si falló
  useEffect(() => {
    if (isMissing(categoriesState)) dispatch(fetchCategories())
  }, [categoriesState, dispatch])

  const rows = categories.filter((category) =>
    normalizeText(`${category.name} ${category.description ?? ''}`).includes(normalizeText(search.trim())),
  )


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
          { key: 'usage', header: 'Experiencias', sortValue: (category) => category.experienceCount, render: (category) => pluralize(category.experienceCount, 'experiencia') },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (category) => (
              <div className="cell-actions">
                <IconButton icon={Pencil} label="Editar" variant="ghost" onClick={() => setEditing(category)} />
                <IconButton icon={Trash2} label="Eliminar" variant="ghost" onClick={() => setDeleting(category)} />
              </div>
            ),
          },
        ]}
      />

      {editing && (
        <CategoryFormModal category={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}
      {deleting && (
        <ConfirmDialog
          title="¿Eliminar categoría?"
          message={`Vas a eliminar “${deleting.name}”.`}
          onConfirm={() =>
            dispatch(deleteCategory(deleting.id))
              .then((action) => {
                if (action.error) {
                  return dispatch(showToast({ message: action.error.message, tone: 'error' }))
                }
                return dispatch(showToast({ message: 'Categoría eliminada', tone: 'info' }))
              })
          }
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  )
}

export default CategoriesAdmin

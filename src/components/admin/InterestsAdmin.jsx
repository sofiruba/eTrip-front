import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCategories } from '../../redux/categoriesSlice'
import { isMissing } from '../../redux/helpers'
import { deleteInterest, fetchInterests } from '../../redux/interestsSlice'
import { showToast } from '../../redux/toastsSlice'
import { normalizeText, pluralize } from '../../utils/format'
import { getInterestIcon } from '../profile/interestIcons'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import DataTable from '../ui/DataTable'
import ErrorState from '../ui/ErrorState'
import IconButton from '../ui/IconButton'
import AdminToolbar from './AdminToolbar'
import InterestFormModal from './InterestFormModal'

/**
 * Intereses: los que eligen las personas y con los que los anfitriones etiquetan sus experiencias.
 * "Planes" es cuántas experiencias disponibles tiene cada uno (lo calcula el back).
 */
function InterestsAdmin() {
  const dispatch = useDispatch()
  // Ya están en el store: se pidieron al abrir la app (los usa el registro y el perfil)
  const interestsState = useSelector((state) => state.interests)
  const categoriesState = useSelector((state) => state.categories)
  const interests = interestsState.items
  const [editing, setEditing] = useState(null) // interés, 'new' o null
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (isMissing(interestsState)) dispatch(fetchInterests())
    if (isMissing(categoriesState)) dispatch(fetchCategories())
  }, [interestsState, categoriesState, dispatch])

  if (interestsState.error) return <ErrorState message={interestsState.error} onRetry={() => dispatch(fetchInterests())} />

  const rows = interests.filter((interest) =>
    normalizeText(`${interest.name} ${interest.categoryName}`).includes(normalizeText(search.trim())),
  )

  return (
    <>
      <AdminToolbar search={search} onSearch={setSearch} placeholder="Buscar interés" count={`${rows.length} de ${interests.length}`}>
        <Button icon={Plus} onClick={() => setEditing('new')} disabled={!categoriesState.items.length}>
          Nuevo interés
        </Button>
      </AdminToolbar>

      <DataTable
        rows={rows}
        columns={[
          {
            key: 'name',
            header: 'Interés',
            sortValue: (interest) => interest.name,
            render: (interest) => {
              const Icon = getInterestIcon(interest.name)
              return (
                <div className="cell-main">
                  <Icon size={20} aria-hidden />
                  <strong>{interest.name}</strong>
                </div>
              )
            },
          },
          { key: 'category', header: 'Categoría', sortValue: (interest) => interest.categoryName, render: (interest) => interest.categoryName },
          {
            key: 'plans',
            header: 'Planes disponibles',
            sortValue: (interest) => interest.availableExperiences,
            render: (interest) => pluralize(interest.availableExperiences, 'plan', 'planes'),
          },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (interest) => (
              <div className="cell-actions">
                <IconButton icon={Pencil} label="Editar" variant="ghost" onClick={() => setEditing(interest)} />
                <IconButton icon={Trash2} label="Eliminar" variant="ghost" onClick={() => setDeleting(interest)} />
              </div>
            ),
          },
        ]}
      />

      {editing && (
        <InterestFormModal interest={editing === 'new' ? null : editing} categories={categoriesState.items} onClose={() => setEditing(null)} />
      )}
      {deleting && (
        <ConfirmDialog
          title="¿Eliminar interés?"
          message={`Vas a eliminar “${deleting.name}”. Se lo sacamos a las experiencias y a las personas que lo tenían.`}
          onConfirm={() =>
            dispatch(deleteInterest({ id: deleting.id, name: deleting.name })).then((action) => {
              // rejected: el back respondió con un error (action.error.message, como en el reducer)
              if (action.error) {
                return dispatch(showToast({ message: action.error.message, tone: 'error' }))
              }
              return dispatch(showToast({ message: 'Interés eliminado', tone: 'info' }))
            })
          }
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  )
}

export default InterestsAdmin

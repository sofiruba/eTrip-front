import { useEffect, useState } from 'react'
import { MessageSquare, Trash2 } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useSearchParams } from 'react-router-dom'
import { deleteReview, fetchAllReviews } from '../../redux/reviewsSlice'
import { showToast } from '../../redux/toastsSlice'
import { byNewest } from '../../utils/experiences'
import { formatFullDate, normalizeText } from '../../utils/format'
import ConfirmDialog from '../ui/ConfirmDialog'
import DataTable from '../ui/DataTable'
import EmptyState from '../ui/EmptyState'
import ErrorState from '../ui/ErrorState'
import Loading from '../ui/Loading'
import IconButton from '../ui/IconButton'
import { StarRating } from '../ui/Rating'
import AdminToolbar from './AdminToolbar'
import { LOW_RATING } from './adminRules'
import './ReviewsAdmin.css'

const RATING_FILTERS = [
  { value: '', label: 'Todas las puntuaciones' },
  { value: 'baja', label: `Para revisar (${LOW_RATING}★ o menos)` },
  { value: '5', label: '5 estrellas' },
  { value: '4', label: '4 estrellas' },
  { value: '3', label: '3 estrellas' },
  { value: '2', label: '2 estrellas' },
  { value: '1', label: '1 estrella' },
]

function ReviewsAdmin() {
  const dispatch = useDispatch()
  const reviews = useSelector((state) => state.reviews.items)
  const error = useSelector((state) => state.reviews.failed.all)
  // Listo cuando llegaron TODAS (antes puede haber solo las de alguna experiencia que se abrió)
  const ready = useSelector((state) => state.reviews.requested.includes('all') && !state.reviews.loading)
  // Filtro inicial desde la URL (los links de "Requiere atención" del resumen)
  const [params] = useSearchParams()
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch] = useState('')
  const [rating, setRating] = useState(() => params.get('puntuacion') ?? '')

  const requested = useSelector((state) => state.reviews.requested.includes('all'))
  useEffect(() => {
    if (!requested) dispatch(fetchAllReviews())
  }, [requested, dispatch])

  const all = [...reviews].sort(byNewest)
  const query = normalizeText(search.trim())
  const rows = all
    .filter((review) => normalizeText(`${review.comment} ${review.experienceTitle} ${review.userName}`).includes(query))
    .filter((review) => {
      if (!rating) return true
      if (rating === 'baja') return review.rating <= LOW_RATING
      return review.rating === Number(rating)
    })

  if (error) return <ErrorState message={error} onRetry={() => dispatch(fetchAllReviews())} />
  if (!ready) return <Loading />

  return (
    <>
      <AdminToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar en reseñas, experiencias o autores"
        count={`${rows.length} de ${all.length}`}
        filters={[{ id: 'rating', label: 'Puntuación', value: rating, onChange: setRating, options: RATING_FILTERS }]}
      />

      <DataTable
        rows={rows}
        empty={<EmptyState icon={MessageSquare} title="No hay reseñas con esos filtros" />}
        columns={[
          {
            key: 'comment',
            header: 'Reseña',
            sortValue: (review) => review.rating,
            render: (review) => (
              <div className={`review-cell ${review.rating <= LOW_RATING ? 'is-low' : ''}`}>
                <StarRating value={review.rating} size={14} />
                <p>{review.comment}</p>
              </div>
            ),
          },
          {
            key: 'experienceTitle',
            header: 'Experiencia',
            sortValue: (review) => review.experienceTitle,
            render: (review) => <Link to={`/experiencias/${review.experienceId}`}>{review.experienceTitle}</Link>,
          },
          { key: 'userName', header: 'Autor', sortValue: (review) => review.userName },
          { key: 'date', header: 'Fecha', sortValue: (review) => review.createdAt, render: (review) => formatFullDate(review.createdAt) },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (review) => <IconButton icon={Trash2} label="Eliminar reseña" variant="ghost" onClick={() => setDeleting(review)} />,
          },
        ]}
      />

      {deleting && (
        <ConfirmDialog
          title="¿Eliminar reseña?"
          message={`Vas a eliminar la reseña de ${deleting.userName} sobre “${deleting.experienceTitle}”.`}
          onConfirm={() =>
            dispatch(deleteReview(deleting))
              .then((action) => {
                if (action.error) {
                  return dispatch(showToast({ message: action.error.message, tone: 'error' }))
                }
                return dispatch(showToast({ message: 'Reseña eliminada', tone: 'info' }))
              })
          }
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  )
}

export default ReviewsAdmin

import { useState } from 'react'
import { MessageSquare, Trash2 } from 'lucide-react'
import { getReviews } from '../../data/selectors'
import { useStore } from '../../hooks/useStore'
import { useToast } from '../../hooks/useToast'
import { formatFullDate } from '../../utils/format'
import ConfirmDialog from '../ui/ConfirmDialog'
import DataTable from '../ui/DataTable'
import EmptyState from '../ui/EmptyState'
import IconButton from '../ui/IconButton'
import { StarRating } from '../ui/Rating'
import './ReviewsAdmin.css'

function ReviewsAdmin() {
  const { db, remove } = useStore()
  const notify = useToast()
  const [deleting, setDeleting] = useState(null)

  return (
    <>
      <DataTable
        rows={getReviews(db)}
        empty={<EmptyState icon={MessageSquare} title="No hay reseñas para moderar" />}
        columns={[
          {
            key: 'comment',
            header: 'Reseña',
            render: (review) => (
              <div className="review-cell">
                <StarRating value={review.rating} size={14} />
                <p>{review.comment}</p>
              </div>
            ),
          },
          { key: 'experienceTitle', header: 'Experiencia' },
          { key: 'userName', header: 'Autor' },
          { key: 'date', header: 'Fecha', render: (review) => formatFullDate(review.createdAt) },
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
          onConfirm={() => {
            remove('reviews', deleting.id)
            notify('Reseña eliminada', 'info')
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  )
}

export default ReviewsAdmin

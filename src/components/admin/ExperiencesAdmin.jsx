import { useState } from 'react'
import { ExternalLink, Eye, Store, Trash2 } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { getUpcomingSessions, isSoldOut } from '../../data/selectors'
import { useStore } from '../../hooks/useStore'
import { useToast } from '../../hooks/useToast'
import { formatMoney, formatSessionDate, isPast, normalizeText, pluralize } from '../../utils/format'
import { getCity } from '../../utils/location'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import DataTable from '../ui/DataTable'
import EmptyState from '../ui/EmptyState'
import IconButton from '../ui/IconButton'
import ImageWithFallback from '../ui/ImageWithFallback'
import Money from '../ui/Money'
import { Rating } from '../ui/Rating'
import AdminToolbar from './AdminToolbar'
import DetailDrawer from './DetailDrawer'

const STATUS_FILTERS = [
  { value: '', label: 'Todos los estados' },
  { value: 'disponible', label: 'Con lugares' },
  { value: 'agotada', label: 'Agotadas' },
  { value: 'sin-fechas', label: 'Sin fechas' },
  { value: 'oferta', label: 'En oferta' },
]

function getStatus(experience) {
  if (isSoldOut(experience)) return { id: 'agotada', label: 'Agotada', tone: 'danger' }
  if (!experience.upcomingCount) return { id: 'sin-fechas', label: 'Sin fechas', tone: 'warning' }
  return { id: 'disponible', label: pluralize(experience.availableSeats, 'lugar', 'lugares'), tone: 'success' }
}

/** Todas las experiencias publicadas: para revisar el catálogo y dar de baja publicaciones. */
function ExperiencesAdmin() {
  const { db, experiences, removeExperience } = useStore()
  // Filtro inicial desde la URL (los links de "Requiere atención" del resumen)
  const [params] = useSearchParams()
  const notify = useToast()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState(() => params.get('estado') ?? '')
  const [selectedId, setSelectedId] = useState(null)
  const [deleting, setDeleting] = useState(null)

  // Ventas de cada experiencia (reservas no reembolsadas)
  const salesOf = (experienceId) =>
    db.bookings
      .filter((booking) => booking.experienceId === experienceId && !booking.refunded)
      .reduce((total, booking) => ({ count: total.count + booking.quantity, amount: total.amount + booking.unitPrice * booking.quantity }), {
        count: 0,
        amount: 0,
      })

  const hasActiveBookings = (experienceId) =>
    db.bookings.some((booking) => booking.experienceId === experienceId && !booking.refunded && !isPast(booking.startsAt))

  const query = normalizeText(search.trim())
  const rows = experiences
    .map((experience) => ({ ...experience, status: getStatus(experience), sales: salesOf(experience.id) }))
    .filter((experience) => normalizeText(`${experience.title} ${experience.publisherName} ${experience.location}`).includes(query))
    .filter((experience) => !category || experience.categoryId === Number(category))
    .filter((experience) => {
      if (!status) return true
      if (status === 'oferta') return experience.discountPercentage > 0
      return experience.status.id === status
    })

  const selected = selectedId && rows.find((experience) => experience.id === selectedId)

  const askDelete = (experience) => {
    if (hasActiveBookings(experience.id)) {
      notify('Tiene reservas próximas: primero hay que reembolsarlas desde Reservas.', 'error')
      return
    }
    setDeleting(experience)
  }

  return (
    <>
      <AdminToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar por título, anfitrión o lugar"
        count={`${rows.length} de ${experiences.length}`}
        filters={[
          {
            id: 'category',
            label: 'Categoría',
            value: category,
            onChange: setCategory,
            options: [{ value: '', label: 'Todas las categorías' }, ...db.categories.map((entry) => ({ value: String(entry.id), label: entry.name }))],
          },
          { id: 'status', label: 'Estado', value: status, onChange: setStatus, options: STATUS_FILTERS },
        ]}
      />

      <DataTable
        rows={rows}
        empty={<EmptyState icon={Store} title="No hay experiencias con esos filtros" />}
        columns={[
          {
            key: 'title',
            header: 'Experiencia',
            sortValue: (experience) => experience.title,
            render: (experience) => (
              <div className="cell-main">
                <ImageWithFallback src={experience.images[0]} alt="" className="cell-thumb" />
                <span>
                  <strong>{experience.title}</strong>
                  <small>{experience.location}</small>
                </span>
              </div>
            ),
          },
          { key: 'publisherName', header: 'Anfitrión', sortValue: (experience) => experience.publisherName },
          {
            key: 'price',
            header: 'Precio',
            sortValue: (experience) => experience.finalPrice,
            render: (experience) => <Money value={experience.finalPrice} original={experience.price} />,
          },
          {
            key: 'status',
            header: 'Disponibilidad',
            sortValue: (experience) => experience.availableSeats,
            render: (experience) => <Badge tone={experience.status.tone}>{experience.status.label}</Badge>,
          },
          {
            key: 'rating',
            header: 'Puntuación',
            sortValue: (experience) => experience.averageRating,
            render: (experience) => <Rating value={experience.averageRating} count={experience.reviewCount} />,
          },
          {
            key: 'sales',
            header: 'Vendido',
            align: 'right',
            sortValue: (experience) => experience.sales.amount,
            render: (experience) => formatMoney(experience.sales.amount),
          },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (experience) => (
              <div className="cell-actions">
                <IconButton icon={Eye} label="Ver detalle" variant="ghost" onClick={() => setSelectedId(experience.id)} />
                <IconButton icon={Trash2} label="Dar de baja" variant="ghost" onClick={() => askDelete(experience)} />
              </div>
            ),
          },
        ]}
      />

      {selected && (
        <DetailDrawer
          title={selected.title}
          description={`${selected.categoryName} · ${getCity(selected.location)}`}
          onClose={() => setSelectedId(null)}
          fields={[
            { label: 'Anfitrión', value: <Link to={`/anfitriones/${selected.publisherId}`}>{selected.publisherName}</Link> },
            { label: 'Ubicación', value: selected.location },
            { label: 'Precio', value: <Money value={selected.finalPrice} original={selected.price} /> },
            { label: 'Descuento', value: selected.discountPercentage ? `${selected.discountPercentage}%` : '—' },
            { label: 'Puntuación', value: selected.reviewCount ? `${selected.averageRating} (${pluralize(selected.reviewCount, 'reseña')})` : 'Sin reseñas' },
            { label: 'Lugares vendidos', value: selected.sales.count },
            { label: 'Total vendido', value: formatMoney(selected.sales.amount) },
          ]}
          footer={
            <>
              <Button variant="ghost" icon={ExternalLink} to={`/experiencias/${selected.id}`}>
                Ver publicación
              </Button>
              <Button variant="danger" icon={Trash2} onClick={() => askDelete(selected)}>
                Dar de baja
              </Button>
            </>
          }
        >
          <h3 className="drawer-subtitle">Próximas fechas</h3>
          {getUpcomingSessions(db, selected.id).length ? (
            <ul className="drawer-sessions">
              {getUpcomingSessions(db, selected.id).map((session) => (
                <li key={session.id}>
                  <span>{formatSessionDate(session.startsAt)}</span>
                  <Badge tone={session.availableSeats ? 'neutral' : 'danger'}>
                    {session.availableSeats ? `${session.availableSeats} / ${session.capacity}` : 'Agotada'}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small">No tiene fechas próximas.</p>
          )}
        </DetailDrawer>
      )}

      {deleting && (
        <ConfirmDialog
          title="¿Dar de baja la experiencia?"
          message={`“${deleting.title}” de ${deleting.publisherName} deja de verse en el sitio, junto con todas sus fechas.`}
          confirmLabel="Dar de baja"
          onConfirm={() => {
            removeExperience(deleting.id)
            setSelectedId(null)
            notify('Experiencia dada de baja', 'info')
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  )
}

export default ExperiencesAdmin

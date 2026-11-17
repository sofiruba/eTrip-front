import { useEffect, useState } from 'react'
import { ExternalLink, Eye, Pencil, Power, Store, Trash2 } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { fetchBookings } from '../../redux/bookingsSlice'
import { deleteExperience, fetchAllExperiences, updateExperienceStatus } from '../../redux/experiencesSlice'
import { isMissing } from '../../redux/helpers'
import { fetchManagedSessions } from '../../redux/sessionsSlice'
import { showToast } from '../../redux/toastsSlice'
import { describeDeletion, describeDeletionResult } from '../../utils/deletion'
import { addSessionInfo, getUpcomingSessions, isSoldOut } from '../../utils/experiences'
import { formatMoney, formatSessionDate, isPast, normalizeText, pluralize } from '../../utils/format'
import { getCity } from '../../utils/location'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import DataTable from '../ui/DataTable'
import EmptyState from '../ui/EmptyState'
import ErrorState from '../ui/ErrorState'
import IconButton from '../ui/IconButton'
import Loading from '../ui/Loading'
import ImageWithFallback from '../ui/ImageWithFallback'
import Money from '../ui/Money'
import AdminToolbar from './AdminToolbar'
import DetailModal from './DetailModal'

const STATUS_FILTERS = [
  { value: '', label: 'Todos los estados' },
  { value: 'disponible', label: 'Con lugares' },
  { value: 'agotada', label: 'Agotadas' },
  { value: 'sin-fechas', label: 'Sin fechas' },
  { value: 'oferta', label: 'En oferta' },
  { value: 'pausada', label: 'Pausadas' },
  { value: 'baja', label: 'Dadas de baja' },
]

// El estado lo manda el back (status); "agotada" sale de los lugares de sus fechas
function getStatus(experience) {
  if (experience.status === 'DELETED') return { id: 'baja', label: 'Dada de baja', tone: 'danger' }
  if (experience.status === 'INACTIVE') return { id: 'pausada', label: 'Pausada', tone: 'neutral' }
  if (experience.status === 'NO_DATES') return { id: 'sin-fechas', label: 'Sin fechas', tone: 'warning' }
  if (isSoldOut(experience)) return { id: 'agotada', label: 'Agotada', tone: 'danger' }
  return { id: 'disponible', label: pluralize(experience.availableSeats, 'lugar', 'lugares'), tone: 'success' }
}

/** Todas las experiencias publicadas: para revisar el catálogo y dar de baja publicaciones. */
function ExperiencesAdmin() {
  const dispatch = useDispatch()
  // Como admin, "managed" son TODAS las experiencias (también las pausadas), con la info de sus fechas
  const managed = useSelector((state) => state.experiences.managed) // { items, loaded, error }
  const managedSessions = useSelector((state) => state.sessions.managed)
  const bookingsState = useSelector((state) => state.bookings)
  const sessions = managedSessions.items
  const bookings = bookingsState.items
  const experiences = addSessionInfo(managed.items, sessions)
  const categories = useSelector((state) => state.categories.items)
  // Filtro inicial desde la URL (los links de "Requiere atención" del resumen)
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState(() => params.get('estado') ?? '')
  const [selectedId, setSelectedId] = useState(null)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    if (isMissing(managed)) dispatch(fetchAllExperiences())
    if (isMissing(managedSessions)) dispatch(fetchManagedSessions())
    if (isMissing(bookingsState)) dispatch(fetchBookings()) // para las ventas de cada una
  }, [managed, managedSessions, bookingsState, dispatch])

  // PATCH (baja lógica): el reducer la reemplaza en el panel y la saca del catálogo público (o la vuelve a poner)
  const toggleActive = (experience) =>
    dispatch(updateExperienceStatus({ id: experience.id, active: !experience.active }))
      .then((action) => {
        if (action.error) {
          return dispatch(showToast({ message: action.error.message, tone: 'error' }))
        }
        return dispatch(showToast({ message: action.payload.active ? 'Experiencia activada' : 'Experiencia desactivada', tone: 'info' }))
      })

  // Ventas de cada experiencia (reservas no reembolsadas)
  const salesOf = (experienceId) =>
    bookings
      .filter((booking) => booking.experienceId === experienceId && !booking.refunded)
      .reduce((total, booking) => ({ count: total.count + booking.quantity, amount: total.amount + Number(booking.paidAmount ?? 0) }), {
        count: 0,
        amount: 0,
      })

  const query = normalizeText(search.trim())
  const rows = experiences
    // `status` del back (ACTIVE / INACTIVE / DELETED…) se reemplaza por el estado visible del panel; `deleted` lo recuerda
    .map((experience) => ({ ...experience, deleted: experience.status === 'DELETED', status: getStatus(experience), sales: salesOf(experience.id) }))
    .filter((experience) => normalizeText(`${experience.title} ${experience.publisherName} ${experience.location}`).includes(query))
    .filter((experience) => !category || experience.categoryId === Number(category))
    .filter((experience) => {
      if (!status) return true
      if (status === 'oferta') return experience.discountPercentage > 0
      return experience.status.id === status
    })

  const selected = selectedId && rows.find((experience) => experience.id === selectedId)

  if (managed.error) return <ErrorState message={managed.error} onRetry={() => dispatch(fetchAllExperiences())} />
  if (!managed.loaded) return <Loading />

  // Dar de baja: el back reembolsa y avisa a todos los que tenían reservas (regla de PLAN) y cancela sus fechas
  const askDelete = (experience) => setDeleting(experience)
  const bookingsWithInfo = bookings.map((booking) => ({ ...booking, isPast: isPast(booking.startsAt) }))

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
            options: [{ value: '', label: 'Todas las categorías' }, ...categories.map((entry) => ({ value: String(entry.id), label: entry.name }))],
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
                  <small>
                    {experience.publisherName} · {experience.location}
                  </small>
                </span>
              </div>
            ),
          },
          {
            key: 'price',
            header: 'Precio',
            sortValue: (experience) => experience.finalPrice,
            render: (experience) => <Money value={experience.finalPrice} original={experience.price} pesos />,
          },
          {
            key: 'status',
            header: 'Disponibilidad',
            sortValue: (experience) => experience.availableSeats,
            render: (experience) => <Badge tone={experience.status.tone}>{experience.status.label}</Badge>,
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
                {/* Una dada de baja ya no se edita ni se vuelve a borrar: queda para consultar sus ventas y reseñas */}
                {!experience.deleted && (
                  <IconButton icon={Pencil} label="Editar (fotos, texto, precio)" variant="ghost" onClick={() => navigate(`/admin/experiencias/${experience.id}/editar`)} />
                )}
                {/* Si ya está pausada, se puede dar de baja directo desde la fila; el resto de las acciones está en el detalle */}
                {!experience.active && !experience.deleted && (
                  <IconButton icon={Trash2} label="Dar de baja" variant="ghost" onClick={() => askDelete(experience)} />
                )}
              </div>
            ),
          },
        ]}
      />

      {selected && (
        <DetailModal
          title={selected.title}
          description={`${selected.categoryName} · ${getCity(selected.location)}`}
          onClose={() => setSelectedId(null)}
          fields={[
            { label: 'Anfitrión', value: <Link to={`/anfitriones/${selected.publisherId}`}>{selected.publisherName}</Link> },
            { label: 'Ubicación', value: selected.location },
            { label: 'Precio', value: <Money value={selected.finalPrice} original={selected.price} pesos /> },
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
              {!selected.deleted && (
                <>
                  <Button variant="secondary" icon={Pencil} to={`/admin/experiencias/${selected.id}/editar`}>
                    Editar
                  </Button>
                  <Button
                    variant="secondary"
                    icon={Power}
                    onClick={() => toggleActive(selected).then(() => setSelectedId(null))}
                  >
                    {selected.active ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button variant="danger" icon={Trash2} onClick={() => askDelete(selected)}>
                    Dar de baja
                  </Button>
                </>
              )}
            </>
          }
        >
          <h3 className="detail-subtitle">Próximas fechas</h3>
          {getUpcomingSessions(sessions, selected.id).length ? (
            <ul className="detail-list">
              {getUpcomingSessions(sessions, selected.id).map((session) => (
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
        </DetailModal>
      )}

      {deleting && (
        <ConfirmDialog
          title="¿Dar de baja la experiencia?"
          message={`${describeDeletion(deleting, bookingsWithInfo)} Si alguna vez se vendió, queda en el panel como “Dada de baja”.`}
          confirmLabel="Dar de baja"
          onConfirm={() =>
            dispatch(deleteExperience(deleting))
              .then((action) => {
                if (action.error) {
                  return dispatch(showToast({ message: action.error.message, tone: 'error' }))
                }
                setSelectedId(null)
                dispatch(showToast({ message: describeDeletionResult(action.payload.result), tone: 'info' }))
              })
          }
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  )
}

export default ExperiencesAdmin

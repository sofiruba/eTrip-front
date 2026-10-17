import { useEffect, useState } from 'react'
import { CalendarHeart, History } from 'lucide-react'
import BookingCard from '../components/booking/BookingCard'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import Loading from '../components/ui/Loading'
import PageHeader from '../components/ui/PageHeader'
import Tabs from '../components/ui/Tabs'
import { useCatalog } from '../hooks/useCatalog'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { getBookings } from '../services/bookingsService'
import { addBookingInfo, splitBookings } from '../utils/bookings'
import './MyBookingsPage.css'

function MyBookingsPage() {
  useDocumentTitle('Mis reservas')
  const { experiences } = useCatalog() // para la foto y el lugar de cada reserva (ya están cargadas)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0) // "Reintentar" lo incrementa y el efecto vuelve a pedir
  const [tab, setTab] = useState('upcoming')

  // Al entrar: mis reservas. Si el back falla se muestra el error, no "no tenés reservas"
  useEffect(() => {
    getBookings()
      .then((data) => {
        setBookings(data)
        setError('')
      })
      .catch((loadError) => setError(loadError.message))
      .then(() => setLoading(false))
  }, [attempt])

  const groups = splitBookings(addBookingInfo(bookings, experiences))
  const visible = groups[tab]

  return (
    <div className="container page">
      <PageHeader eyebrow="Mi actividad" title="Mis" accent="reservas." description="Tus vouchers, fechas y compras en un solo lugar." />

      <Tabs
        label="Filtrar reservas"
        value={tab}
        onChange={setTab}
        items={[
          { id: 'upcoming', label: 'Próximas', count: groups.upcoming.length },
          { id: 'past', label: 'Pasadas y canceladas', count: groups.past.length },
        ]}
      />

      <div className="my-bookings__list">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState title="No pudimos cargar tus reservas" message={error} onRetry={() => setAttempt((current) => current + 1)} />
        ) : visible.length ? (
          <div className="booking-list">
            {visible.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        ) : tab === 'upcoming' ? (
          <EmptyState icon={CalendarHeart} title="No tenés planes próximos" text="¿Qué tal si buscamos uno para este finde?">
            <Button to="/">Explorar experiencias</Button>
          </EmptyState>
        ) : (
          <EmptyState icon={History} title="Todavía no hay planes pasados" text="Acá vas a ver las experiencias que ya viviste." />
        )}
      </div>
    </div>
  )
}

export default MyBookingsPage

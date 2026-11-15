import { useEffect, useState } from 'react'
import { CalendarHeart, History, RotateCcw } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import BookingCard from '../components/booking/BookingCard'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import Loading from '../components/ui/Loading'
import PageHeader from '../components/ui/PageHeader'
import Tabs from '../components/ui/Tabs'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { fetchBookings } from '../redux/bookingsSlice'
import { addBookingInfo, splitBookings } from '../utils/bookings'
import './MyBookingsPage.css'

function MyBookingsPage() {
  useDocumentTitle('Mis reservas')
  const dispatch = useDispatch()
  // Nos suscribimos a las tres propiedades del slice de reservas
  const { items: bookings, loaded, error } = useSelector((state) => state.bookings)
  const experiences = useSelector((state) => state.experiences.items) // para la foto y el lugar de cada reserva
  const [tab, setTab] = useState('upcoming')

  // Al entrar: mis reservas. Una sola vez por sesión: una compra nueva se suma sola (reducer de createOrder)
  useEffect(() => {
    if (!loaded) dispatch(fetchBookings())
  }, [loaded, dispatch])

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
        {/* Si el back falla se muestra el error, no "no tenés reservas" */}
        {error ? (
          <ErrorState title="No pudimos cargar tus reservas" message={error} onRetry={() => dispatch(fetchBookings())} />
        ) : !loaded ? (
          <Loading />
        ) : visible.length ? (
          <div className="booking-list">
            {visible.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                // En las pasadas: volver al detalle con la misma cantidad de personas (solo si la experiencia sigue publicada)
                action={
                  tab === 'past' && booking.experience ? (
                    <Button size="sm" variant="secondary" icon={RotateCcw} to={`/experiencias/${booking.experience.id}?personas=${booking.quantity}`}>
                      Volver a reservar
                    </Button>
                  ) : null
                }
              />
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

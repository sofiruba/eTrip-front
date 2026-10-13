import { useEffect, useState } from 'react'
import { CalendarHeart, History } from 'lucide-react'
import BookingCard from '../components/booking/BookingCard'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Loading from '../components/ui/Loading'
import PageHeader from '../components/ui/PageHeader'
import Tabs from '../components/ui/Tabs'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { getBookings } from '../services/bookingsService'
import { getExperiences } from '../services/experiencesService'
import { addBookingInfo, splitBookings } from '../utils/bookings'
import './MyBookingsPage.css'

function MyBookingsPage() {
  useDocumentTitle('Mis reservas')
  const [bookings, setBookings] = useState([])
  const [experiences, setExperiences] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('upcoming')

  // Al entrar: mis reservas y las experiencias (para mostrar la foto y el lugar de cada una)
  useEffect(() => {
    getBookings()
      .then((data) => setBookings(data))
      .catch((error) => console.error('Error al traer tus reservas:', error))
      .then(() => setLoading(false))

    getExperiences()
      .then((data) => setExperiences(data))
      .catch((error) => console.error('Error al traer las experiencias:', error))
  }, [])

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

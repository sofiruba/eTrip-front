import { useState } from 'react'
import { CalendarHeart, History } from 'lucide-react'
import BookingCard from '../components/booking/BookingCard'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import PageHeader from '../components/ui/PageHeader'
import Tabs from '../components/ui/Tabs'
import { getBookings, splitBookings } from '../data/selectors'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useStore } from '../hooks/useStore'
import './MyBookingsPage.css'

function MyBookingsPage() {
  useDocumentTitle('Mis reservas')
  const { db } = useStore()
  const { user } = useAuth()
  const [tab, setTab] = useState('upcoming')
  const groups = splitBookings(getBookings(db, (booking) => booking.buyerId === user.id))
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
        {visible.length ? (
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

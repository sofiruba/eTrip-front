import { useEffect, useState } from 'react'
import { CalendarDays, LayoutGrid, Plus, Store, Users } from 'lucide-react'
import { useParams } from 'react-router-dom'
import HostBookings from '../components/host/HostBookings'
import HostCalendar from '../components/host/HostCalendar'
import HostExperiences from '../components/host/HostExperiences'
import HostOverview from '../components/host/HostOverview'
import Button from '../components/ui/Button'
import Loading from '../components/ui/Loading'
import PageHeader from '../components/ui/PageHeader'
import Tabs from '../components/ui/Tabs'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { getSales } from '../services/bookingsService'
import { getMyExperiences } from '../services/experiencesService'
import { getSessions } from '../services/sessionsService'
import { addBookingInfo } from '../utils/bookings'
import { addSessionInfo, byStartsAt } from '../utils/experiences'
import NotFoundPage from './NotFoundPage'
import './HostPage.css'

const TABS = [
  { id: 'resumen', label: 'Resumen', icon: LayoutGrid, to: '/anfitrion' },
  { id: 'experiencias', label: 'Mis experiencias', icon: Store, to: '/anfitrion/experiencias' },
  { id: 'calendario', label: 'Calendario', icon: CalendarDays, to: '/anfitrion/calendario' },
  { id: 'reservas', label: 'Huéspedes', icon: Users, to: '/anfitrion/reservas' },
]

/**
 * Modo anfitrión. Esta página es la dueña de los datos: los pide al montarse
 * y les pasa a cada pestaña los datos y las funciones para actualizarlos.
 */
function HostPage() {
  const { tab = 'resumen' } = useParams()
  const { user } = useAuth()
  const [experiences, setExperiences] = useState([])
  const [sessions, setSessions] = useState([])
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  useDocumentTitle('Modo anfitrión')

  const loadSales = () =>
    getSales()
      .then((data) => setSales(data))
      .catch((error) => console.error('Error al traer tus ventas:', error))

  useEffect(() => {
    getMyExperiences()
      .then((data) => setExperiences(data))
      .catch((error) => console.error('Error al traer tus experiencias:', error))
      .then(() => setLoading(false))

    getSessions()
      .then((data) => setSessions(data))
      .catch((error) => console.error('Error al traer las fechas:', error))

    loadSales()
  }, [])

  if (!TABS.some((item) => item.id === tab)) return <NotFoundPage />

  const myExperiences = addSessionInfo(experiences, sessions)
  const myIds = experiences.map((experience) => experience.id)
  const mySessions = sessions.filter((session) => myIds.includes(session.experienceId)).sort(byStartsAt)
  const myBookings = addBookingInfo(sales, experiences)

  const panels = {
    resumen: experiences.length ? (
      <HostOverview experiences={myExperiences} sessions={mySessions} bookings={myBookings} />
    ) : (
      <HostExperiences experiences={[]} bookings={[]} setExperiences={setExperiences} />
    ),
    experiencias: <HostExperiences experiences={myExperiences} bookings={myBookings} setExperiences={setExperiences} />,
    // Cancelar una fecha reembolsa sus reservas: después volvemos a pedir las ventas
    calendario: <HostCalendar experiences={myExperiences} sessions={mySessions} setSessions={setSessions} onChange={loadSales} />,
    reservas: <HostBookings bookings={myBookings} sessions={sessions} setBookings={setSales} />,
  }

  return (
    <div className="container page">
      <PageHeader
        eyebrow="Modo anfitrión"
        title={`Hola, ${user.firstName}.`}
        description="Gestioná tus experiencias, fechas y huéspedes desde un solo lugar."
        actions={
          <Button icon={Plus} to="/anfitrion/experiencias/nueva">
            Nueva experiencia
          </Button>
        }
      />
      <Tabs items={TABS} label="Secciones del modo anfitrión" />
      <div className="host-page__panel">{loading ? <Loading /> : panels[tab]}</div>
    </div>
  )
}

export default HostPage

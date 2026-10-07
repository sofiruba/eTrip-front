import { CalendarDays, LayoutGrid, Plus, Store, Users } from 'lucide-react'
import { useParams } from 'react-router-dom'
import HostBookings from '../components/host/HostBookings'
import HostCalendar from '../components/host/HostCalendar'
import HostExperiences from '../components/host/HostExperiences'
import HostOverview from '../components/host/HostOverview'
import Button from '../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'
import Tabs from '../components/ui/Tabs'
import { byStartsAt, getHostBookings } from '../data/selectors'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useStore } from '../hooks/useStore'
import NotFoundPage from './NotFoundPage'
import './HostPage.css'

const TABS = [
  { id: 'resumen', label: 'Resumen', icon: LayoutGrid, to: '/anfitrion' },
  { id: 'experiencias', label: 'Mis experiencias', icon: Store, to: '/anfitrion/experiencias' },
  { id: 'calendario', label: 'Calendario', icon: CalendarDays, to: '/anfitrion/calendario' },
  { id: 'reservas', label: 'Huéspedes', icon: Users, to: '/anfitrion/reservas' },
]

/** Modo anfitrión: reemplaza a las 6 pantallas sueltas que había antes. */
function HostPage() {
  const { tab = 'resumen' } = useParams()
  useDocumentTitle('Modo anfitrión')
  const { db, experiences } = useStore()
  const { user } = useAuth()

  if (!TABS.some((item) => item.id === tab)) return <NotFoundPage />

  const myExperiences = experiences.filter((experience) => experience.publisherId === user.id)
  const myExperienceIds = myExperiences.map((experience) => experience.id)
  const mySessions = db.sessions.filter((session) => myExperienceIds.includes(session.experienceId)).sort(byStartsAt)
  const myBookings = getHostBookings(db, user.id)

  const panels = {
    resumen: myExperiences.length ? (
      <HostOverview experiences={myExperiences} sessions={mySessions} bookings={myBookings} />
    ) : (
      <HostExperiences experiences={[]} bookings={[]} />
    ),
    experiencias: <HostExperiences experiences={myExperiences} bookings={myBookings} />,
    calendario: <HostCalendar experiences={myExperiences} sessions={mySessions} />,
    reservas: <HostBookings bookings={myBookings} />,
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
      <div className="host-page__panel">{panels[tab]}</div>
    </div>
  )
}

export default HostPage

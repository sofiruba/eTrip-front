import { useEffect } from 'react'
import { CalendarDays, LayoutGrid, Plus, Store } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, useParams } from 'react-router-dom'
import HostAgenda from '../components/host/HostAgenda'
import HostExperienceAgenda from '../components/host/HostExperienceAgenda'
import HostExperiences from '../components/host/HostExperiences'
import HostOverview from '../components/host/HostOverview'
import Button from '../components/ui/Button'
import ErrorState from '../components/ui/ErrorState'
import Loading from '../components/ui/Loading'
import PageHeader from '../components/ui/PageHeader'
import Tabs from '../components/ui/Tabs'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { fetchSales } from '../redux/bookingsSlice'
import { fetchMyExperiences } from '../redux/experiencesSlice'
import { fetchManagedSessions } from '../redux/sessionsSlice'
import { addBookingInfo } from '../utils/bookings'
import { addSessionInfo, byStartsAt } from '../utils/experiences'
import NotFoundPage from './NotFoundPage'
import './HostPage.css'

const TABS = [
  { id: 'resumen', label: 'Resumen', icon: LayoutGrid, to: '/anfitrion' },
  { id: 'experiencias', label: 'Mis experiencias', icon: Store, to: '/anfitrion/experiencias' },
  // Fechas y huéspedes juntos, por experiencia: /anfitrion/fechas y /anfitrion/fechas/:experienceId
  { id: 'fechas', label: 'Fechas y huéspedes', icon: CalendarDays, to: '/anfitrion/fechas', end: false },
]

/**
 * Modo anfitrión. Pide sus datos al montarse (una sola vez por sesión: si se vuelve a entrar, ya están en el store).
 * Cada pestaña recibe los datos por props y, cuando cambia algo, despacha su acción: el reducer actualiza el store
 * y esta página (suscripta con useSelector) le pasa los datos nuevos.
 */
function HostPage() {
  const { tab = 'resumen', experienceId } = useParams()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const managed = useSelector((state) => state.experiences.managed) // las mías: { items, loaded, error }
  const managedSessions = useSelector((state) => state.sessions.managed)
  const salesState = useSelector((state) => state.bookings.sales)
  const sessions = managedSessions.items
  const sales = salesState.items
  const experiences = addSessionInfo(managed.items, sessions) // con la info de sus fechas
  useDocumentTitle('Modo anfitrión')

  // Cada GET una sola vez: si ya se cargó (por ejemplo, al volver a esta sección), no se repite
  useEffect(() => {
    if (!managed.loaded) dispatch(fetchMyExperiences())
  }, [managed.loaded, dispatch])
  useEffect(() => {
    // Todas las fechas de mis experiencias, también las pasadas y las canceladas
    if (!managedSessions.loaded) dispatch(fetchManagedSessions())
  }, [managedSessions.loaded, dispatch])
  useEffect(() => {
    if (!salesState.loaded) dispatch(fetchSales())
  }, [salesState.loaded, dispatch])

  if (!TABS.some((item) => item.id === tab) || (experienceId && tab !== 'fechas')) return <NotFoundPage />

  const myIds = experiences.map((experience) => experience.id)
  const mySessions = sessions.filter((session) => myIds.includes(session.experienceId)).sort(byStartsAt)
  const myBookings = addBookingInfo(sales, experiences)

  const panels = {
    resumen: experiences.length ? (
      <HostOverview experiences={experiences} sessions={mySessions} bookings={myBookings} />
    ) : (
      <HostExperiences experiences={[]} bookings={[]} />
    ),
    experiencias: <HostExperiences experiences={experiences} bookings={myBookings} />,
    fechas: <HostAgenda experiences={experiences} />,
  }

  // Detalle de una experiencia: sus fechas y, adentro de cada una, quién reservó
  const selected = experienceId && experiences.find((experience) => experience.id === Number(experienceId))
  // Una experiencia que no es mía (o que ya no existe): volvemos a la lista
  if (experienceId && managed.loaded && !selected) return <Navigate to="/anfitrion/fechas" replace />
  if (selected) {
    // Sus fechas y reservas también tienen que estar en el store antes de mostrarlas
    const waiting = !managedSessions.loaded || !salesState.loaded
    const failed = managedSessions.error || salesState.error
    panels.fechas = failed ? (
      <ErrorState
        message={failed}
        onRetry={() => {
          if (managedSessions.error) dispatch(fetchManagedSessions())
          if (salesState.error) dispatch(fetchSales())
        }}
      />
    ) : waiting ? (
      <Loading />
    ) : (
      <HostExperienceAgenda
        // key: al pasar de una experiencia a otra el componente arranca de cero (pestaña y fechas abiertas)
        key={selected.id}
        experience={selected}
        sessions={mySessions.filter((session) => session.experienceId === selected.id)}
        bookings={myBookings.filter((booking) => booking.experienceId === selected.id)}
      />
    )
  }

  const content = managed.error ? (
    <ErrorState title="No pudimos cargar tus experiencias" message={managed.error} onRetry={() => dispatch(fetchMyExperiences())} />
  ) : !managed.loaded ? (
    <Loading />
  ) : (
    panels[tab]
  )

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
      <div className="host-page__panel">{content}</div>
    </div>
  )
}

export default HostPage

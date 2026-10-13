import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import { useParams } from 'react-router-dom'
import ExperienceCard from '../components/experience/ExperienceCard'
import InterestList from '../components/profile/InterestList'
import Avatar from '../components/ui/Avatar'
import EmptyState from '../components/ui/EmptyState'
import Loading from '../components/ui/Loading'
import PageHeader from '../components/ui/PageHeader'
import SectionHeader from '../components/ui/SectionHeader'
import StatCard from '../components/ui/StatCard'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { getExperiencesByHost } from '../services/experiencesService'
import { getSessions } from '../services/sessionsService'
import { getUser } from '../services/usersService'
import { addSessionInfo } from '../utils/experiences'
import { fullName } from '../utils/format'
import NotFoundPage from './NotFoundPage'
import './HostProfilePage.css'

function HostProfilePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [experiences, setExperiences] = useState([])
  const [sessions, setSessions] = useState([])
  const [host, setHost] = useState(null)
  const [loading, setLoading] = useState(true)

  // Las experiencias del anfitrión (y las fechas, para las tarjetas) se piden al entrar
  useEffect(() => {
    getExperiencesByHost(id)
      .then((data) => setExperiences(data))
      .catch((error) => console.error('Error al traer las experiencias:', error))
      .then(() => setLoading(false))

    getSessions()
      .then((data) => setSessions(data))
      .catch((error) => console.error('Error al traer las fechas:', error))
  }, [id])

  // El perfil completo solo se puede pedir con sesión iniciada
  const userId = user?.id
  useEffect(() => {
    if (!userId) return
    getUser(id)
      .then((data) => setHost(data))
      .catch((error) => console.error('Error al traer el anfitrión:', error))
  }, [id, userId])

  // Sin sesión usamos el nombre que viene en sus experiencias
  const name = host ? fullName(host) : experiences[0]?.publisherName
  useDocumentTitle(name ?? 'Anfitrión')

  if (loading) return <Loading />
  if (!name) return <NotFoundPage title="No encontramos a este anfitrión" />

  const hostExperiences = addSessionInfo(experiences, sessions)
  const reviewCount = experiences.reduce((sum, experience) => sum + experience.reviewCount, 0)
  const averageRating = reviewCount
    ? experiences.reduce((sum, experience) => sum + experience.averageRating * experience.reviewCount, 0) / reviewCount
    : 0

  return (
    <div className="container page">
      <PageHeader back={{ to: '/', label: 'Volver a explorar' }} eyebrow="Anfitrión" title={name} />

      <section className="host-profile card">
        <Avatar name={name} src={host?.avatarUrl} size="xl" />
        <div className="stack">
          <p>{host?.bio || `${name} comparte sus planes favoritos en PLAN.`}</p>
          {host?.interests?.length > 0 && (
            <div className="host-profile__interests">
              <h2 className="eyebrow">Le gusta</h2>
              <InterestList interests={host.interests} />
            </div>
          )}
          {host?.city && (
            <span className="meta">
              <MapPin size={16} aria-hidden />
              {host.city}
            </span>
          )}
        </div>
      </section>

      <div className="stat-grid section">
        <StatCard label="Calificación" value={reviewCount ? averageRating.toFixed(1) : '—'} />
        <StatCard label="Reseñas" value={reviewCount} />
        <StatCard label="Experiencias" value={experiences.length} />
      </div>

      <section className="section">
        <SectionHeader eyebrow="Sus planes" title={`Experiencias de ${name}`} />
        {hostExperiences.length ? (
          <div className="experience-grid">
            {hostExperiences.map((experience) => (
              <ExperienceCard key={experience.id} experience={experience} />
            ))}
          </div>
        ) : (
          <EmptyState title="Todavía no publicó experiencias" />
        )}
      </section>
    </div>
  )
}

export default HostProfilePage

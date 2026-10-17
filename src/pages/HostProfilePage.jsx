import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import { useParams } from 'react-router-dom'
import ExperienceCard from '../components/experience/ExperienceCard'
import InterestList from '../components/profile/InterestList'
import Avatar from '../components/ui/Avatar'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import Loading from '../components/ui/Loading'
import PageHeader from '../components/ui/PageHeader'
import SectionHeader from '../components/ui/SectionHeader'
import StatCard from '../components/ui/StatCard'
import { useCatalog } from '../hooks/useCatalog'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { getExperiencesByHost } from '../services/experiencesService'
import { getUser } from '../services/usersService'
import { addSessionInfo } from '../utils/experiences'
import { fullName } from '../utils/format'
import NotFoundPage from './NotFoundPage'
import './HostProfilePage.css'

// `onRetry` lo pasa RemountOnParam (App.jsx)
function HostProfilePage({ onRetry }) {
  const { id } = useParams()
  const { sessions } = useCatalog() // las fechas para las tarjetas ya están en el catálogo
  const [experiences, setExperiences] = useState([])
  const [host, setHost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')

  // Al entrar: el perfil (público, sin datos privados si no sos vos) y sus experiencias, en paralelo
  useEffect(() => {
    Promise.all([getUser(id), getExperiencesByHost(id)])
      .then(([hostData, experiencesData]) => {
        setHost(hostData)
        setExperiences(experiencesData)
      })
      .catch((loadError) => (loadError.status === 404 ? setNotFound(true) : setError(loadError.message)))
      .then(() => setLoading(false))
  }, [id])

  const name = host ? fullName(host) : null
  useDocumentTitle(name ?? 'Anfitrión')

  if (loading) return <Loading />
  if (notFound) return <NotFoundPage title="No encontramos a este anfitrión" />
  if (error) {
    return (
      <div className="container page page--narrow">
        <ErrorState title="No pudimos cargar este perfil" message={error} onRetry={onRetry} />
      </div>
    )
  }

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

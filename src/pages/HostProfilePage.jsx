import { useEffect } from 'react'
import { MapPin } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
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
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { fetchUserById } from '../redux/usersSlice'
import { addSessionInfo } from '../utils/experiences'
import { fullName } from '../utils/format'
import NotFoundPage from './NotFoundPage'
import './HostProfilePage.css'

function HostProfilePage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  // Perfil público: { item, loading, error, notFound }
  const profile = useSelector((state) => state.users.profiles[id])
  // Sus experiencias publicadas ya están en el catálogo (con sus fechas): no hace falta otro GET
  const catalogState = useSelector((state) => state.experiences)
  const sessionsState = useSelector((state) => state.sessions)
  const catalog = addSessionInfo(catalogState.items, sessionsState.items)
  const catalogStatus = {
    loading: !catalogState.loaded || !sessionsState.loaded,
    error: catalogState.error || sessionsState.error,
  }

  // El perfil se pide una vez por anfitrión (si ya está en el store, no se repite el GET)
  useEffect(() => {
    if (!profile) dispatch(fetchUserById(id))
  }, [profile, id, dispatch])

  const host = profile?.item ?? null
  const name = host ? fullName(host) : null
  useDocumentTitle(name ?? 'Anfitrión')

  if (profile?.notFound) return <NotFoundPage title="No encontramos a este anfitrión" />
  const error = profile?.error || catalogStatus.error
  if (error) {
    return (
      <div className="container page page--narrow">
        <ErrorState title="No pudimos cargar este perfil" message={error} onRetry={() => dispatch(fetchUserById(id))} />
      </div>
    )
  }
  if (!host || catalogStatus.loading) return <Loading />

  const experiences = catalog.filter((experience) => experience.publisherId === host.id)
  const reviewCount = experiences.reduce((sum, experience) => sum + experience.reviewCount, 0)
  const averageRating = reviewCount
    ? experiences.reduce((sum, experience) => sum + experience.averageRating * experience.reviewCount, 0) / reviewCount
    : 0

  return (
    <div className="container page">
      <PageHeader back={{ to: '/', label: 'Volver a explorar' }} eyebrow="Anfitrión" title={name} />

      <section className="host-profile card">
        <Avatar name={name} src={host.avatarUrl} size="xl" />
        <div className="stack">
          <p>{host.bio || `${name} comparte sus planes favoritos en PLAN.`}</p>
          {host.interests?.length > 0 && (
            <div className="host-profile__interests">
              <h2 className="eyebrow">Le gusta</h2>
              <InterestList interests={host.interests} />
            </div>
          )}
          {host.city && (
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
        {experiences.length ? (
          <div className="experience-grid">
            {experiences.map((experience) => (
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

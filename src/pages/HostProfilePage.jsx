import { CalendarDays, MapPin } from 'lucide-react'
import { useParams } from 'react-router-dom'
import ExperienceCard from '../components/experience/ExperienceCard'
import Avatar from '../components/ui/Avatar'
import EmptyState from '../components/ui/EmptyState'
import PageHeader from '../components/ui/PageHeader'
import SectionHeader from '../components/ui/SectionHeader'
import StatCard from '../components/ui/StatCard'
import { findById } from '../data/selectors'
import { useStore } from '../hooks/useStore'
import { fullName } from '../utils/format'
import NotFoundPage from './NotFoundPage'
import './HostProfilePage.css'

function HostProfilePage() {
  const { id } = useParams()
  const { db, experiences } = useStore()
  const host = findById(db.users, id)

  if (!host) return <NotFoundPage title="No encontramos a este anfitrión" />

  const hostExperiences = experiences.filter((experience) => experience.publisherId === host.id)
  const reviewCount = hostExperiences.reduce((sum, experience) => sum + experience.reviewCount, 0)
  const averageRating = reviewCount
    ? hostExperiences.reduce((sum, experience) => sum + experience.averageRating * experience.reviewCount, 0) / reviewCount
    : 0

  return (
    <div className="container page">
      <PageHeader back={{ to: '/', label: 'Volver a explorar' }} eyebrow="Anfitrión" title={fullName(host)} />

      <section className="host-profile card">
        <Avatar name={fullName(host)} size="xl" />
        <div className="stack">
          <p>{host.bio || 'Todavía no escribió su presentación.'}</p>
          <div className="row">
            <span className="meta">
              <MapPin size={16} aria-hidden />
              {host.city}
            </span>
            <span className="meta">
              <CalendarDays size={16} aria-hidden />
              En PLAN desde {new Date(host.joinedAt).getFullYear()}
            </span>
          </div>
        </div>
      </section>

      <div className="stat-grid section">
        <StatCard label="Calificación" value={reviewCount ? averageRating.toFixed(1) : '—'} />
        <StatCard label="Reseñas" value={reviewCount} />
        <StatCard label="Experiencias" value={hostExperiences.length} />
      </div>

      <section className="section">
        <SectionHeader eyebrow="Sus planes" title={`Experiencias de ${host.firstName}`} />
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

import { useState } from 'react'
import { CalendarCheck, Heart, MessageSquare, Pencil, Store, Trash2 } from 'lucide-react'
import ReviewFormModal from '../components/booking/ReviewFormModal'
import ExperienceCard from '../components/experience/ExperienceCard'
import ReviewCard from '../components/experience/ReviewCard'
import EditProfileModal from '../components/profile/EditProfileModal'
import InterestPicker from '../components/profile/InterestPicker'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import SectionHeader from '../components/ui/SectionHeader'
import StatCard from '../components/ui/StatCard'
import { getReviews, getUserStats } from '../data/selectors'
import { useAuth } from '../hooks/useAuth'
import { useFavorites } from '../hooks/useFavorites'
import { useStore } from '../hooks/useStore'
import { useToast } from '../hooks/useToast'
import { fullName } from '../utils/format'
import './ProfilePage.css'

function ProfilePage() {
  const { db, experiences, remove } = useStore()
  const { user, updateProfile } = useAuth()
  const { favoriteIds } = useFavorites()
  const notify = useToast()
  const [editingProfile, setEditingProfile] = useState(false)
  const [interestsDraft, setInterestsDraft] = useState(null) // null = no se está editando
  const [editingReview, setEditingReview] = useState(null)
  const [deletingReview, setDeletingReview] = useState(null)

  const stats = getUserStats(db, user.id)
  const favorites = experiences.filter((experience) => favoriteIds.includes(experience.id))
  const myReviews = getReviews(db, (review) => review.userId === user.id)

  const saveInterests = () => {
    updateProfile({ interests: interestsDraft })
    setInterestsDraft(null)
    notify('Intereses actualizados')
  }

  return (
    <div className="container page">
      <section className="profile-hero">
        <Avatar name={fullName(user)} size="xl" />
        <div className="profile-hero__info">
          <Badge tone="brand">{user.role === 'ADMIN' ? 'Administrador' : 'Cliente'}</Badge>
          <h1>{fullName(user)}</h1>
          <p className="muted">
            {user.email} · {user.city} · En PLAN desde {new Date(user.joinedAt).getFullYear()}
          </p>
          {user.bio && <p>{user.bio}</p>}
        </div>
        <div className="profile-hero__actions">
          <Button variant="secondary" icon={Pencil} onClick={() => setEditingProfile(true)}>
            Editar perfil
          </Button>
          <Button variant="ghost" icon={Store} to="/anfitrion">
            Modo anfitrión
          </Button>
        </div>
      </section>

      <div className="stat-grid section">
        <StatCard icon={CalendarCheck} label="Reservas" value={stats.bookings} />
        <StatCard icon={MessageSquare} label="Reseñas" value={stats.reviews} />
        <StatCard icon={Heart} label="Guardados" value={favorites.length} />
        <StatCard icon={Store} label="Experiencias publicadas" value={stats.published} />
      </div>

      <section className="section card">
        <SectionHeader eyebrow="Para conocerte mejor" title="¿Qué te gusta hacer?">
          {!interestsDraft && (
            <Button size="sm" variant="secondary" onClick={() => setInterestsDraft(user.interests)}>
              Editar intereses
            </Button>
          )}
        </SectionHeader>
        {interestsDraft ? (
          <div className="stack">
            <InterestPicker value={interestsDraft} onChange={setInterestsDraft} />
            <div className="row">
              <Button size="sm" onClick={saveInterests} disabled={!interestsDraft.length}>
                Guardar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setInterestsDraft(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : user.interests.length ? (
          <div className="chip-list">
            {user.interests.map((interest) => (
              <Badge key={interest} tone="brand">
                {interest}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="muted">Todavía no elegiste intereses.</p>
        )}
      </section>

      <section className="section">
        <SectionHeader eyebrow="Guardados" title="Planes que te gustaron" />
        {favorites.length ? (
          <div className="experience-grid">
            {favorites.map((experience) => (
              <ExperienceCard key={experience.id} experience={experience} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Heart} title="Todavía no guardaste planes" text="Tocá el corazón de una experiencia para guardarla acá.">
            <Button to="/" variant="secondary">
              Explorar experiencias
            </Button>
          </EmptyState>
        )}
      </section>

      <section className="section">
        <SectionHeader eyebrow="Tu voz" title="Mis reseñas" />
        {myReviews.length ? (
          <div className="review-grid">
            {myReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                showExperience
                actions={
                  <>
                    <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditingReview(review)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setDeletingReview(review)}>
                      Eliminar
                    </Button>
                  </>
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={MessageSquare}
            title="Todavía no escribiste reseñas"
            text="Después de vivir una experiencia, vas a poder contar cómo fue desde Mis reservas."
          />
        )}
      </section>

      {editingProfile && <EditProfileModal onClose={() => setEditingProfile(false)} />}
      {editingReview && (
        <ReviewFormModal
          review={editingReview}
          experienceTitle={editingReview.experienceTitle}
          onClose={() => setEditingReview(null)}
        />
      )}
      {deletingReview && (
        <ConfirmDialog
          title="¿Eliminar reseña?"
          message={`Vas a borrar tu reseña de “${deletingReview.experienceTitle}”. No se puede deshacer.`}
          onConfirm={() => {
            remove('reviews', deletingReview.id)
            notify('Reseña eliminada', 'info')
          }}
          onClose={() => setDeletingReview(null)}
        />
      )}
    </div>
  )
}

export default ProfilePage

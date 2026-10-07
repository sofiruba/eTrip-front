import { useState } from 'react'
import { CalendarCheck, Check, CreditCard, ExternalLink, Heart, MessageSquare, Pencil, Store, Trash2 } from 'lucide-react'
import ReviewFormModal from '../components/booking/ReviewFormModal'
import CardBrandIcon from '../components/checkout/CardBrandIcon'
import ExperienceCard from '../components/experience/ExperienceCard'
import ReviewCard from '../components/experience/ReviewCard'
import AvatarUploader from '../components/profile/AvatarUploader'
import EditProfileModal from '../components/profile/EditProfileModal'
import InterestList from '../components/profile/InterestList'
import InterestPicker from '../components/profile/InterestPicker'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import SectionHeader from '../components/ui/SectionHeader'
import StatCard from '../components/ui/StatCard'
import { getReviews, getUserStats } from '../data/selectors'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useFavorites } from '../hooks/useFavorites'
import { useSavedCards } from '../hooks/useSavedCards'
import { useStore } from '../hooks/useStore'
import { useToast } from '../hooks/useToast'
import { cardExpiry, cardLabel, isCardExpired } from '../utils/cards'
import { fullName } from '../utils/format'
import './ProfilePage.css'

const MIN_INTERESTS = 2

/** Pasos para completar el perfil; cada uno dice qué hacer si falta. */
function getProfileSteps(user) {
  return [
    { id: 'foto', label: 'Subí una foto', done: Boolean(user.avatarUrl) },
    { id: 'bio', label: 'Contá algo sobre vos', done: Boolean(user.bio?.trim()) },
    { id: 'ciudad', label: 'Indicá tu ciudad', done: Boolean(user.city?.trim()) },
    { id: 'intereses', label: `Elegí ${MIN_INTERESTS} intereses`, done: (user.interests?.length ?? 0) >= MIN_INTERESTS },
  ]
}

function ProfilePage() {
  useDocumentTitle('Mi perfil')
  const { db, experiences, remove } = useStore()
  const { user, updateProfile } = useAuth()
  const { favoriteIds } = useFavorites()
  const savedCards = useSavedCards()
  const notify = useToast()
  const [editingProfile, setEditingProfile] = useState(false)
  const [interestsDraft, setInterestsDraft] = useState(null) // null = no se está editando
  const [editingReview, setEditingReview] = useState(null)
  const [deletingReview, setDeletingReview] = useState(null)
  const [deletingCard, setDeletingCard] = useState(null)

  const stats = getUserStats(db, user.id)
  const favorites = experiences.filter((experience) => favoriteIds.includes(experience.id))
  const myReviews = getReviews(db, (review) => review.userId === user.id)
  const interests = user.interests ?? []
  const steps = getProfileSteps(user)
  const doneSteps = steps.filter((step) => step.done).length
  const roleLabel = user.role === 'ADMIN' ? 'Administrador' : stats.published ? 'Anfitrión' : 'Miembro'

  const goToStep = (stepId) => {
    if (stepId === 'intereses') setInterestsDraft(interests)
    else if (stepId === 'foto') document.querySelector('.avatar-uploader__button')?.click()
    else setEditingProfile(true)
  }

  const saveInterests = () => {
    updateProfile({ interests: interestsDraft })
    setInterestsDraft(null)
    notify('Intereses actualizados')
  }

  return (
    <div className="container page">
      <section className="profile-hero">
        <AvatarUploader />
        <div className="profile-hero__info">
          <Badge tone="brand">{roleLabel}</Badge>
          <h1>{fullName(user)}</h1>
          <p className="muted">
            {user.username && <>@{user.username} · </>}
            {user.email}
            {user.city && <> · {user.city}</>} · En PLAN desde {new Date(user.joinedAt).getFullYear()}
          </p>
          {user.bio && <p>{user.bio}</p>}
        </div>
        <div className="profile-hero__actions">
          <Button variant="secondary" icon={Pencil} onClick={() => setEditingProfile(true)}>
            Editar perfil
          </Button>
          {stats.published > 0 ? (
            <Button variant="ghost" icon={ExternalLink} to={`/anfitriones/${user.id}`}>
              Ver perfil público
            </Button>
          ) : (
            <Button variant="ghost" icon={Store} to="/anfitrion">
              Modo anfitrión
            </Button>
          )}
        </div>
      </section>

      {doneSteps < steps.length && (
        <section className="section card profile-steps">
          <div className="profile-steps__header">
            <div>
              <h2>Completá tu perfil</h2>
              <p className="muted small">Un perfil completo genera más confianza en anfitriones y otros viajeros.</p>
            </div>
            <span className="profile-steps__count">
              {doneSteps} de {steps.length}
            </span>
          </div>
          <div className="profile-steps__bar" aria-hidden>
            <span style={{ width: `${(doneSteps / steps.length) * 100}%` }} />
          </div>
          <ul className="profile-steps__list">
            {steps.map((step) => (
              <li key={step.id} className={step.done ? 'is-done' : ''}>
                {step.done ? (
                  <span>
                    <Check size={16} aria-hidden />
                    {step.label}
                  </span>
                ) : (
                  <button type="button" onClick={() => goToStep(step.id)}>
                    {step.label}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="stat-grid section">
        <StatCard icon={CalendarCheck} label="Reservas" value={stats.bookings} />
        <StatCard icon={MessageSquare} label="Reseñas" value={stats.reviews} />
        <StatCard icon={Heart} label="Guardados" value={favorites.length} />
        <StatCard icon={Store} label="Experiencias publicadas" value={stats.published} />
      </div>

      <section className="section card">
        <SectionHeader
          eyebrow="Para conocerte mejor"
          title="Mis intereses"
          description="Los usamos para recomendarte planes. También se ven en tu perfil público."
        >
          {!interestsDraft && (
            <Button size="sm" variant="secondary" onClick={() => setInterestsDraft(interests)}>
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
        ) : interests.length ? (
          <InterestList interests={interests} />
        ) : (
          <p className="muted">Todavía no elegiste intereses.</p>
        )}
      </section>

      <section className="section card">
        <SectionHeader eyebrow="Pagos" title="Medios de pago guardados" />
        {savedCards.cards.length ? (
          <ul className="saved-cards">
            {savedCards.cards.map((card) => (
              <li key={card.id}>
                <CardBrandIcon brand={card.brand} />
                <span className="saved-cards__text">
                  <strong>{cardLabel(card)}</strong>
                  <small className={isCardExpired(card) ? 'saved-cards__expired' : 'muted'}>
                    {isCardExpired(card) ? 'Vencida' : `Vence ${cardExpiry(card)}`} · {card.holder}
                  </small>
                </span>
                <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setDeletingCard(card)}>
                  Eliminar
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted row">
            <CreditCard size={18} aria-hidden />
            Todavía no guardaste tarjetas. Podés hacerlo al pagar tu próxima reserva.
          </p>
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
      {deletingCard && (
        <ConfirmDialog
          title="¿Eliminar tarjeta?"
          message={`Vas a quitar ${cardLabel(deletingCard)} de tus medios de pago.`}
          onConfirm={() => {
            savedCards.removeCard(deletingCard.id)
            notify('Tarjeta eliminada', 'info')
          }}
          onClose={() => setDeletingCard(null)}
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

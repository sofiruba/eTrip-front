import { useEffect, useState } from 'react'
import { CalendarCheck, Heart, MessageSquare, Store } from 'lucide-react'
import EditProfileModal from '../components/profile/EditProfileModal'
import FavoritesSection from '../components/profile/FavoritesSection'
import InterestsSection from '../components/profile/InterestsSection'
import MyReviewsSection from '../components/profile/MyReviewsSection'
import ProfileHero from '../components/profile/ProfileHero'
import ProfileSteps from '../components/profile/ProfileSteps'
import SavedCardsSection from '../components/profile/SavedCardsSection'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import StatCard from '../components/ui/StatCard'
import { useAuth } from '../hooks/useAuth'
import { useCatalog } from '../hooks/useCatalog'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useFavorites } from '../hooks/useFavorites'
import { useSavedCards } from '../hooks/useSavedCards'
import { useToast } from '../hooks/useToast'
import { deleteReview, getMyReviews } from '../services/reviewsService'
import { getMe } from '../services/usersService'
import { cardLabel } from '../utils/cards'
import { byNewest } from '../utils/experiences'

/** Perfil del usuario. La página trae los datos y maneja los modales; cada sección es un componente. */
function ProfilePage() {
  useDocumentTitle('Mi perfil')
  const { user, updateProfile } = useAuth()
  const { experiences } = useCatalog() // para mostrar los favoritos
  const { favoriteIds } = useFavorites()
  const savedCards = useSavedCards()
  const notify = useToast()
  const [myReviews, setMyReviews] = useState([])
  const [me, setMe] = useState(user)
  const [editingProfile, setEditingProfile] = useState(false)
  const [interestsDraft, setInterestsDraft] = useState(null) // null = no se está editando
  const [deletingReview, setDeletingReview] = useState(null)
  const [deletingCard, setDeletingCard] = useState(null)

  // Al entrar: mis reseñas y mis datos actualizados (los contadores de reservas y reseñas vienen del back)
  useEffect(() => {
    getMyReviews()
      .then((data) => setMyReviews(data.sort(byNewest)))
      .catch((error) => console.error('Error al traer tus reseñas:', error))

    getMe()
      .then((data) => setMe(data))
      .catch((error) => console.error('Error al traer tu perfil:', error))
  }, [])

  const published = me.publishedExperiences ?? 0
  const favorites = experiences.filter((experience) => favoriteIds.includes(experience.id))
  const interests = user.interests ?? []

  // DELETE en el back y, si sale bien, la sacamos de la lista local (sin volver a pedir todo)
  const removeReview = (review) =>
    deleteReview(review.id)
      .then(() => {
        setMyReviews(myReviews.filter((entry) => entry.id !== review.id))
        notify('Reseña eliminada', 'info')
      })
      .catch((error) => notify(error.message, 'error'))

  // Desde "Completá tu perfil": cada paso abre lo que hay que completar
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
      <ProfileHero user={user} publishedCount={published} onEdit={() => setEditingProfile(true)} />
      <ProfileSteps user={user} onStep={goToStep} />

      <div className="stat-grid section">
        <StatCard icon={CalendarCheck} label="Reservas" value={me.bookingsCount ?? 0} />
        <StatCard icon={MessageSquare} label="Reseñas" value={me.reviewsCount ?? 0} />
        <StatCard icon={Heart} label="Guardados" value={favorites.length} />
        <StatCard icon={Store} label="Experiencias publicadas" value={published} />
      </div>

      <InterestsSection interests={interests} draft={interestsDraft} onDraftChange={setInterestsDraft} onSave={saveInterests} />
      <SavedCardsSection cards={savedCards.cards} onDelete={setDeletingCard} />
      <FavoritesSection experiences={favorites} />
      <MyReviewsSection reviews={myReviews} onDelete={setDeletingReview} />

      {editingProfile && <EditProfileModal onClose={() => setEditingProfile(false)} />}
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
          onConfirm={() => removeReview(deletingReview)}
          onClose={() => setDeletingReview(null)}
        />
      )}
    </div>
  )
}

export default ProfilePage

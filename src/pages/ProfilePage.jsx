import { useEffect, useRef, useState } from 'react'
import { CalendarCheck, MessageSquare, Store } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import EditProfileModal from '../components/profile/EditProfileModal'
import InterestsSection from '../components/profile/InterestsSection'
import MyReviewsSection from '../components/profile/MyReviewsSection'
import ProfileHero from '../components/profile/ProfileHero'
import ProfileSteps from '../components/profile/ProfileSteps'
import SavedCardsSection from '../components/profile/SavedCardsSection'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import StatCard from '../components/ui/StatCard'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { updateMe } from '../redux/authSlice'
import { deleteReview, fetchMyReviews } from '../redux/reviewsSlice'
import { removeCard } from '../redux/savedCardsSlice'
import { showToast } from '../redux/toastsSlice'
import { cardLabel } from '../utils/cards'
import { byNewest } from '../utils/experiences'

/** Perfil del usuario. La página lee los datos del store y maneja los modales; cada sección es un componente. */
function ProfilePage() {
  useDocumentTitle('Mi perfil')
  const dispatch = useDispatch()
  // Los contadores (reservas, reseñas, publicadas) vienen del back en el usuario y los reducers los mantienen al día
  const user = useSelector((state) => state.auth.user)
  const savedCards = useSelector((state) => state.savedCards.byUser[state.auth.user?.id]) ?? []
  const { items: allReviews, requested } = useSelector((state) => state.reviews)
  const myReviewsRequested = requested.includes('mine')
  const [editingProfile, setEditingProfile] = useState(false)
  const [interestsDraft, setInterestsDraft] = useState(null) // null = no se está editando
  const [savingInterests, setSavingInterests] = useState(false)
  const [deletingReview, setDeletingReview] = useState(null)
  const [deletingCard, setDeletingCard] = useState(null)
  const avatarButtonRef = useRef(null) // botón "Cambiar foto" del encabezado

  // Al entrar: mis reseñas (una sola vez por sesión)
  useEffect(() => {
    if (!myReviewsRequested) dispatch(fetchMyReviews())
  }, [myReviewsRequested, dispatch])

  const myReviews = allReviews.filter((review) => review.userId === user.id).sort(byNewest)
  const published = user.publishedExperiences ?? 0
  const interests = user.interests ?? []

  // DELETE en el back; el reducer la saca de la lista (sin volver a pedir todo)
  const removeReview = (review) =>
    dispatch(deleteReview(review))
      .then((action) => {
        if (action.error) {
          return dispatch(showToast({ message: action.error.message, tone: 'error' }))
        }
        return dispatch(showToast({ message: 'Reseña eliminada', tone: 'info' }))
      })

  // Desde "Completá tu perfil": cada paso abre lo que hay que completar
  const goToStep = (stepId) => {
    if (stepId === 'intereses') setInterestsDraft(interests)
    else if (stepId === 'foto') avatarButtonRef.current?.click() // abre el selector de foto del encabezado
    else setEditingProfile(true)
  }

  // PUT /users/me solo con los intereses: el reducer guarda el usuario que devuelve el back (el Home los usa en "Para vos")
  const saveInterests = () => {
    setSavingInterests(true)
    dispatch(updateMe({ interests: interestsDraft }))
      .then((action) => {
        setSavingInterests(false)
        if (action.error) {
          return dispatch(showToast({ message: action.error.message, tone: 'error' }))
        }
        setInterestsDraft(null)
        return dispatch(showToast({ message: 'Intereses actualizados', link: { label: 'Ver planes para vos', to: '/' } }))
      })
  }

  return (
    <div className="container page">
      <ProfileHero user={user} publishedCount={published} onEdit={() => setEditingProfile(true)} avatarButtonRef={avatarButtonRef} />
      <ProfileSteps user={user} onStep={goToStep} />

      <div className="stat-grid section">
        <StatCard icon={CalendarCheck} label="Reservas" value={user.bookingsCount ?? 0} />
        <StatCard icon={MessageSquare} label="Reseñas" value={user.reviewsCount ?? 0} />
        <StatCard icon={Store} label="Experiencias publicadas" value={published} />
      </div>

      <InterestsSection
        interests={interests}
        draft={interestsDraft}
        saving={savingInterests}
        onDraftChange={setInterestsDraft}
        onSave={saveInterests}
      />
      <SavedCardsSection cards={savedCards} onDelete={setDeletingCard} />
      <MyReviewsSection reviews={myReviews} onDelete={setDeletingReview} />

      {editingProfile && <EditProfileModal onClose={() => setEditingProfile(false)} />}
      {deletingCard && (
        <ConfirmDialog
          title="¿Eliminar tarjeta?"
          message={`Vas a quitar ${cardLabel(deletingCard)} de tus medios de pago.`}
          onConfirm={() => {
            dispatch(removeCard({ userId: user.id, cardId: deletingCard.id }))
            dispatch(showToast({ message: 'Tarjeta eliminada', tone: 'info' }))
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

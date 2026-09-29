import { useState } from 'react'
import { experiences, reviews, sessions } from '../data/mockData'
import ActivityCard from '../components/ActivityCard'
import BookingCard from '../components/BookingCard'
import DetailGallery from '../components/DetailGallery'
import DetailInfoSections from '../components/DetailInfoSections'
import ExperienceSummary from '../components/ExperienceSummary'
import ReviewsSection from '../components/ReviewsSection'

function Detail({ item, onBack, onAdd, onBook }) {
  const [chosenSession, setChosenSession] = useState(0)
  const gallery = [item.image, ...experiences.filter((experience) => experience.id !== item.id).map((experience) => experience.image)].slice(0, 4)
  const activities = [
    ['Conocé el plan', 'Un recorrido pensado para descubrir algo nuevo.'],
    ['Viví el momento', 'Un momento para compartir con gente copada.'],
    ['Llevate una historia', 'Una experiencia local guiada por tu anfitrión.'],
  ]

  return <main className="detail-page">
    <button className="back-button" onClick={onBack}>← Volver a explorar</button>
    <section className="detail-top"><DetailGallery images={gallery} title={item.title} /><ExperienceSummary item={item} reviewCount={reviews.length + 18} /></section>
    <div className="detail-body">
      <div className="detail-content">
        <section className="what-you-do"><h2>Qué vas a hacer</h2>{activities.map(([title, description], index) => <ActivityCard key={title} image={gallery[index + 1] || item.image} title={title} description={description} />)}</section>
        <ReviewsSection reviews={reviews} rating={item.rating} />
        <DetailInfoSections item={item} />
      </div>
      <BookingCard item={item} sessions={sessions} chosenSession={chosenSession} onChooseSession={setChosenSession} onBook={onBook} onAdd={onAdd} />
    </div>
  </main>
}

export default Detail

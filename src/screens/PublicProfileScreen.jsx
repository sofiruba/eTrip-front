import { experiences } from '../data/mockData'
import ExperienceCard from '../components/ExperienceCard'

function PublicProfileScreen({ onBack, onSelect }) {
  return <main className="inner-page"><button className="back-button" onClick={onBack}>← Volver</button><div className="public-profile"><span className="big-avatar">NF</span><span className="intro-tag">ANFITRIÓN VERIFICADO</span><h1>Nico & Sofi</h1><p>Crean experiencias para descubrir Buenos Aires de otra manera.</p><div className="stats"><div><strong>4.9</strong><span>valoración</span></div><div><strong>128</strong><span>reseñas</span></div><div><strong>3</strong><span>experiencias</span></div></div></div><h2 className="subheading">Experiencias de Nico & Sofi</h2><div className="experience-grid"><ExperienceCard item={experiences[0]} onSelect={onSelect} /></div></main>
}

export default PublicProfileScreen

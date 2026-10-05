import { experiences } from '../data/mockData'
import ExperienceCard from '../components/ExperienceCard'

function CategoryDetail({ category, onBack, onSelect }) {
  const items = experiences.filter((item) => item.category === category)
  return <main className="inner-page"><button className="back-button" onClick={onBack}>← Volver a explorar</button><div className="page-title"><span className="intro-tag">CATEGORÍA</span><h1>Planes de <em>{category}.</em></h1><p>Elegí una experiencia y armá un plan que te den ganas de cumplir.</p></div>{items.length ? <div className="experience-grid">{items.map((item) => <ExperienceCard item={item} key={item.id} onSelect={onSelect} />)}</div> : <div className="empty-state"><h2>Todavía no hay planes acá</h2><p>Estamos preparando nuevas experiencias.</p></div>}</main>
}

export default CategoryDetail

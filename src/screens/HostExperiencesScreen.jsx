import { experiences } from '../data/mockData'
import ExperienceCard from '../components/ExperienceCard'

function HostExperiences({ onBack, onCreate, onEdit, onSelect }) {
  return <main className="host-dashboard"><button className="back-button" onClick={onBack}>← Volver al resumen</button><header className="host-page-title"><div><span className="eyebrow">MODO ANFITRIÓN</span><h1>Mis experiencias.</h1><p>Administrá tus planes, precios y publicaciones.</p></div><button className="primary-button" onClick={onCreate}>＋ Crear experiencia</button></header><div className="host-experience-grid">{experiences.slice(0, 2).map((item) => <div className="host-owned-card" key={item.id}><ExperienceCard item={item} onSelect={onSelect} /><div className="host-owned-actions"><span className="status active">Publicada</span><button onClick={onEdit}>Editar</button><button onClick={() => onSelect(item)}>Ver publicación</button></div></div>)}</div></main>
}

export default HostExperiences

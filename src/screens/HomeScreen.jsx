import { categories } from '../data/mockData'
import ExperienceCard from '../components/ExperienceCard'
import EmptyState from '../components/EmptyState'
import { experiences } from '../data/mockData'
import UpcomingPlans from '../components/UpcomingPlans'

function Home({ filtered, category, setCategory, onCategory, onSelect, onAuth }) {
  return <main>
    <section className="hero"><div className="hero-copy"><div className="intro-tag">✦ EXPERIENCIAS CURADAS PARA VOS</div><h1>Tu próximo<br /><em>plan empieza acá.</em></h1><p>Descubrí experiencias con personas copadas, elegí una sesión y reservá tu lugar para hacer algo distinto.</p><div className="hero-actions"><button className="primary-button" onClick={() => document.getElementById('experiences').scrollIntoView()}>Explorar experiencias <span>→</span></button><button className="text-button" onClick={onAuth}>Crear una cuenta</button></div></div><div className="hero-stamp"><span>PLAN</span><strong>Hacé algo<br />que te haga bien.</strong><small>Buenos Aires · 2025</small></div></section>
    <UpcomingPlans plans={[{ ...experiences[0], target: '2026-10-26T16:00:00' }, { ...experiences[1], date: 'Dom 27 Oct · 12:30' }, { ...experiences[2], date: 'Sáb 12 Nov · 18:30' }]} onSelect={onSelect} />
    <section className="section category-section"><div className="section-heading"><div><p className="eyebrow">EXPLORÁ POR CATEGORÍA</p><h2>¿Qué plan pinta?</h2></div><span className="result-count">{filtered.length} experiencias</span></div><div className="category-list">{categories.map((item) => <button className={`category-pill ${category === item ? 'selected' : ''}`} key={item} onClick={() => item === 'Todas' ? setCategory(item) : onCategory(item)}>{item === 'Todas' ? '✦' : item === 'Gastronomía' ? '🍴' : item === 'Arte & salidas' ? '🎨' : item === 'Escapadas' ? '🌿' : item === 'Música' ? '♫' : '✧'} <span>{item}</span></button>)}</div></section>
    <section className="section experiences-section" id="experiences"><div className="section-heading"><div><p className="eyebrow">PLANES DESTACADOS</p><h2>Elegí tu próxima experiencia</h2></div><button className="filter-button">☷ Filtros</button></div><div className="experience-grid">{filtered.map((item) => <ExperienceCard key={item.id} item={item} onSelect={onSelect} />)}</div>{!filtered.length && <EmptyState title="No encontramos ese plan" text="Probá con otra búsqueda o categoría." />}</section>
  </main>
}

export default Home

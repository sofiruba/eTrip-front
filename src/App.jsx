import './App.css'

const categories = [
  { icon: '🍴', label: 'Comer' },
  { icon: '🎨', label: 'Crear' },
  { icon: '🌿', label: 'Escaparse' },
  { icon: '🎵', label: 'Música' },
  { icon: '✨', label: 'Bienestar' },
]

const experiences = [
  {
    title: 'Sabores de La Boca',
    host: 'con Martina',
    location: 'La Boca, Buenos Aires',
    rating: '4.9',
    reviews: '128',
    price: '$18.500',
    sessions: 'Hoy · 19:30',
    category: 'Comer',
    image:
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=85',
  },
  {
    title: 'Clase de cerámica',
    host: 'con Vale',
    location: 'Villa Crespo, Buenos Aires',
    rating: '4.8',
    reviews: '86',
    price: '$22.000',
    sessions: 'Mañana · 16:00',
    category: 'Crear',
    image:
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=900&q=85',
  },
  {
    title: 'Kayak al atardecer',
    host: 'con Santi',
    location: 'Tigre, Buenos Aires',
    rating: '5.0',
    reviews: '54',
    price: '$28.000',
    sessions: 'Sáb 12 · 18:30',
    category: 'Escaparse',
    image:
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=85',
  },
  {
    title: 'Cata de vinos',
    host: 'con Tomás',
    location: 'Palermo, Buenos Aires',
    rating: '4.9',
    reviews: '201',
    price: '$25.000',
    sessions: 'Vie 11 · 20:00',
    category: 'Comer',
    image:
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=85',
  },
]

function App() {
  return (
    <div className="app-shell">
      <header className="navbar">
        <a className="brand" href="/" aria-label="Plan inicio">
          <span className="brand-mark">✦</span>
          <span>plan</span>
        </a>
        <div className="header-search">
          <span>⌕</span>
          <input aria-label="Buscar experiencias" placeholder="Buscar experiencias..." />
        </div>
        <div className="user-actions">
          <button className="host-link" type="button">Publicá tu experiencia</button>
          <button className="icon-button" type="button" aria-label="Notificaciones">♡</button>
          <button className="profile-button" type="button">
            <span className="avatar">SR</span>
            <span className="profile-name">Sofía</span>
            <span className="chevron">⌄</span>
          </button>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">EXPERIENCIAS CERCA TUYO</p>
            <h1>¿Qué plan<br /><span>pinta?</span></h1>
            <p className="hero-text">
              Encontrá eso que tenías ganas de hacer. Planes únicos,
              personas copadas y momentos para recordar.
            </p>
            <div className="hero-actions">
              <button className="primary-button" type="button">Explorar experiencias <span>→</span></button>
              <button className="text-button" type="button">Ver cómo funciona</button>
            </div>
          </div>
          <div className="hero-image-wrap">
            <img
              src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1100&q=85"
              alt="Personas disfrutando una experiencia juntas"
            />
            <div className="image-note">
              <span className="note-icon">✦</span>
              <span><strong>Planes que conectan</strong><small>Viví algo distinto hoy</small></span>
            </div>
          </div>
        </section>

        <section className="category-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ELEGÍ TU MOOD</p>
              <h2>¿Qué tenés ganas de hacer?</h2>
            </div>
            <a className="see-all" href="#experiencias">Ver todas <span>→</span></a>
          </div>
          <div className="category-list">
            {categories.map((category, index) => (
              <button className={`category-pill ${index === 0 ? 'selected' : ''}`} type="button" key={category.label}>
                <span>{category.icon}</span>{category.label}
              </button>
            ))}
          </div>
        </section>

        <section className="experiences-section" id="experiencias">
          <div className="section-heading">
            <div>
              <p className="eyebrow">PARA VOS</p>
              <h2>Planes cerca tuyo</h2>
            </div>
            <div className="filter-actions">
              <button className="filter-button" type="button">⌘ Filtros</button>
              <button className="view-button active" type="button">▦</button>
              <button className="view-button" type="button">☷</button>
            </div>
          </div>
          <div className="experience-grid">
            {experiences.map((experience) => (
              <article className="experience-card" key={experience.title}>
                <div className="card-image">
                  <img src={experience.image} alt={experience.title} />
                  <button className="heart-button" type="button" aria-label={`Guardar ${experience.title}`}>♡</button>
                  <span className="session-badge">{experience.sessions}</span>
                </div>
                <div className="card-info">
                  <div className="card-title-row">
                    <h3>{experience.title}</h3>
                    <span className="rating">★ {experience.rating}</span>
                  </div>
                  <p>{experience.host}</p>
                  <p className="muted">{experience.location} · {experience.category}</p>
                  <div className="card-footer">
                    <strong>{experience.price} <small>/ persona</small></strong>
                    <span>{experience.reviews} reseñas</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer>
        <span>© 2025 plan</span>
        <span>Encontrá tu próximo plan.</span>
      </footer>
    </div>
  )
}

export default App

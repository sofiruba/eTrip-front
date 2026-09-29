const values = [
  { icon: '✦', title: 'Planes, no paquetes', text: 'No vendemos escapadas prefabricadas. Te ayudamos a encontrar algo que realmente tengas ganas de hacer.' },
  { icon: '☻', title: 'Gente real', text: 'Cada experiencia la propone alguien que sabe, disfruta y tiene algo para compartir.' },
  { icon: '↗', title: 'Menos scrollear', text: 'Más salir de casa, conocer gente y volver con una anécdota que no empiece con “vi un reel de...”.' },
]

function About({ onNavigate }) {
  return <main className="about-page">
    <section className="about-hero">
      <span className="intro-tag">SOBRE PLAN</span>
      <h1>No hacemos viajes.<br /><em>Hacemos que salgas.</em></h1>
      <p>PLAN nació para encontrar esos planes que siempre decís que vas a hacer “algún día”. Ese día puede ser hoy.</p>
      <button className="primary-button" onClick={() => onNavigate('home')}>Ver experiencias <span>→</span></button>
    </section>
    <section className="about-note">
      <span className="about-note-mark">“</span>
      <p>Una plataforma para hacer cerámica, remar, comer rico, conocer gente y dejar de responder “vemos” en el grupo.</p>
      <small>— El equipo de PLAN, probablemente buscando un plan</small>
    </section>
    <section className="about-values">
      <div className="section-heading"><div><span className="eyebrow">POR QUÉ EXISTIMOS</span><h2>La vida pide planes.</h2></div></div>
      <div className="about-value-grid">{values.map((value) => <article className="about-value" key={value.title}><span>{value.icon}</span><h3>{value.title}</h3><p>{value.text}</p></article>)}</div>
    </section>
    <section className="about-cta"><h2>¿Ya encontraste tu próximo plan?</h2><button className="outline-button" onClick={() => onNavigate('home')}>Explorar ahora</button></section>
  </main>
}

export default About

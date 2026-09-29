function ExperienceSummary({ item, reviewCount }) {
  return <section className="detail-summary">
    <div className="detail-summary-actions"><button aria-label="Compartir">↗</button><button aria-label="Guardar">♡</button></div>
    <span className="category-label">{item.category}</span>
    <h1>{item.title}</h1>
    <p className="detail-subtitle">{item.subtitle}</p>
    <div className="detail-rating">★ <strong>{item.rating}</strong> · {reviewCount} calificaciones</div>
    <p className="detail-location">{item.location} · Experiencias</p>
    <div className="summary-host"><span className="avatar">NF</span><span>Anfitrión: <strong>{item.host}</strong><small>Anfitrión verificado</small></span></div>
    <div className="summary-facts"><div><span>◷</span><p><strong>Aproximadamente 2 h</strong><small>Se ofrece en Español</small></p></div><div><span>✓</span><p><strong>¿Qué incluye?</strong><small>Todo lo necesario para disfrutar el plan</small></p></div></div>
  </section>
}

export default ExperienceSummary

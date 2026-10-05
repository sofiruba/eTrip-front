import ImageWithFallback from './ImageWithFallback'
import Money from './Money'

function ExperienceCard({ item, onSelect }) {
  return (
    <article className="experience-card" onClick={() => onSelect(item)}>
      <div className="card-image" style={{ background: item.color }}>
        <ImageWithFallback src={item.image} alt={item.title} />
        <button className="heart-button" onClick={(event) => event.stopPropagation()}>♡</button>
        <span className="session-badge">{item.date}</span>
      </div>
      <div className="card-info">
        <div className="card-title-row"><h3>{item.title}</h3><span className="rating">★ {item.rating}</span></div>
        <p>{item.subtitle}</p>
        <p className="muted">{item.host} · {item.location}</p>
        <div className="card-footer"><strong><Money value={item.price} /> <small>/ persona</small></strong><span>{item.spots} cupos</span></div>
      </div>
    </article>
  )
}

export default ExperienceCard

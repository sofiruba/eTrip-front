import ImageWithFallback from './ImageWithFallback'
import CountdownCard from './CountdownCard'

function UpcomingPlans({ plans, onSelect }) {
  const [nextPlan, ...otherPlans] = plans
  return <section className="upcoming-plans">
    <div className="upcoming-plans-heading"><div><span className="eyebrow">TU ACTIVIDAD</span><h2>Tus próximos planes</h2><p>Todo listo para que disfrutes tus próximas experiencias.</p></div><span className="upcoming-count">{plans.length} reservas</span></div>
    <div className="upcoming-plans-grid">
      <article className="upcoming-plan-featured" onClick={() => onSelect(nextPlan)}><ImageWithFallback src={nextPlan.image} alt={nextPlan.title} /><div className="upcoming-plan-featured-content"><span className="category-label">PRÓXIMO PLAN</span><h3>{nextPlan.title}</h3><p>{nextPlan.subtitle}</p><div className="upcoming-plan-meta"><span>◷ {nextPlan.date}</span><span>⌖ {nextPlan.location}</span></div><CountdownCard target={nextPlan.target} compact /></div></article>
      <div className="upcoming-plan-list">{otherPlans.map((plan) => <button className="upcoming-plan-item" key={plan.id} onClick={() => onSelect(plan)}><ImageWithFallback src={plan.image} alt={plan.title} /><span><strong>{plan.title}</strong><small>{plan.date}</small><small>{plan.location}</small></span><b>→</b></button>)}</div>
    </div>
  </section>
}

export default UpcomingPlans

import './StatCard.css'

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <article className="stat-card">
      {Icon && (
        <span className="stat-card__icon">
          <Icon size={18} aria-hidden />
        </span>
      )}
      <span className="stat-card__label">{label}</span>
      <strong className="stat-card__value">{value}</strong>
      {hint && <small className="muted">{hint}</small>}
    </article>
  )
}

export default StatCard

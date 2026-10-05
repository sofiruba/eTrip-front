function EmptyState({ title, text, action, onClick }) {
  return (
    <div className="empty-state">
      <div>✦</div>
      <h2>{title}</h2>
      <p>{text}</p>
      {action && <button className="primary-button" onClick={onClick}>{action} →</button>}
    </div>
  )
}

export default EmptyState

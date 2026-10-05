function ManagementHeader({ eyebrow, title, description, action, onAction }) {
  return (
    <div className="page-title management-header">
      <span className="intro-tag">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
      {action && <button className="primary-button" onClick={onAction}>{action} ＋</button>}
    </div>
  )
}

export default ManagementHeader

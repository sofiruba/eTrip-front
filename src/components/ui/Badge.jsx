import './Badge.css'

/** tone: neutral | brand | success | warning | danger */
function Badge({ tone = 'neutral', children }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

export default Badge

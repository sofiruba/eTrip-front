import { Link } from 'react-router-dom'
import { getInterestIcon } from '../profile/interestIcons'
import './TagList.css'

/** Intereses (tags) de una experiencia. Cada uno lleva al catálogo filtrado por ese interés. */
function TagList({ tags }) {
  if (!tags?.length) return null
  return (
    <ul className="tag-list" aria-label="Intereses relacionados">
      {tags.map((tag) => {
        const Icon = getInterestIcon(tag)
        return (
          <li key={tag}>
            <Link to={`/?tags=${encodeURIComponent(tag)}`} className="tag-list__tag">
              <Icon size={16} strokeWidth={1.5} aria-hidden />
              {tag}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export default TagList

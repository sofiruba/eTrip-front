import { getInterestIcon } from './interestIcons'
import './InterestList.css'

/** Intereses en grilla, cada uno con su ícono (perfil propio y perfil público). */
function InterestList({ interests }) {
  return (
    <ul className="interest-list">
      {interests.map((interest) => {
        const Icon = getInterestIcon(interest)
        return (
          <li key={interest}>
            <Icon size={22} strokeWidth={1.5} aria-hidden />
            {interest}
          </li>
        )
      })}
    </ul>
  )
}

export default InterestList

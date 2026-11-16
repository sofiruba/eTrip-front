import { getDestinations } from '../../utils/experiences'
import './HomeStats.css'

/** Los números de PLAN, calculados con el catálogo que ya está en el store: prueba social debajo del buscador. */
function HomeStats({ experiences }) {
  if (experiences.length < 5) return null
  const cities = getDestinations(experiences).length
  const hosts = new Set(experiences.map((experience) => experience.publisherId)).size
  const reviews = experiences.reduce((sum, experience) => sum + experience.reviewCount, 0)
  const rated = experiences.filter((experience) => experience.reviewCount > 0)
  const average = rated.length
    ? rated.reduce((sum, experience) => sum + experience.averageRating * experience.reviewCount, 0) / reviews
    : 0

  const stats = [
    { value: experiences.length, label: 'experiencias' },
    { value: cities, label: cities === 1 ? 'ciudad' : 'ciudades' },
    { value: hosts, label: 'anfitriones' },
    ...(reviews ? [{ value: `${average.toFixed(1)} ★`, label: `en ${reviews} reseñas` }] : []),
  ]

  return (
    <ul className="home-stats" aria-label="PLAN en números">
      {stats.map((stat) => (
        <li key={stat.label}>
          <strong>{stat.value}</strong>
          <span>{stat.label}</span>
        </li>
      ))}
    </ul>
  )
}

export default HomeStats

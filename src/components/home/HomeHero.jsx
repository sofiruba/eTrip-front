import HeroSearch from '../search/HeroSearch'
import { getAvailableDates, getDestinations } from '../../utils/experiences'
import './HomeHero.css'

/** Portada del inicio con el buscador grande. Al buscar avisa los filtros elegidos (onSearch). */
function HomeHero({ filters, experiences, sessions, onSearch }) {
  return (
    <section className="hero">
      <span className="eyebrow">Experiencias para salir de la rutina</span>
      <h1>
        Hacé un plan <em>distinto.</em>
      </h1>
      <p className="hero__lead">
        Descubrí experiencias nuevas, elegí una fecha y reservá tu lugar. En tu ciudad o en la que estés de viaje, siempre hay
        algo distinto para hacer.
      </p>
      <HeroSearch
        id="hero-search"
        value={filters}
        destinations={getDestinations(experiences)}
        availableDates={getAvailableDates(sessions)}
        experiences={experiences}
        onSearch={onSearch}
      />
    </section>
  )
}

export default HomeHero

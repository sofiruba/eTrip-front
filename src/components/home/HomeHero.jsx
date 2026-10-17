import { useRef } from 'react'
import HeroSearch from '../search/HeroSearch'
import HeroCollage from './HeroCollage'
import { getAvailableDates, getDestinations } from '../../utils/experiences'
import './HomeHero.css'

const canMove = () => window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches

/** Portada del inicio con el buscador grande. Al buscar avisa los filtros elegidos (onSearch). */
function HomeHero({ filters, experiences, sessions, onSearch }) {
  const heroRef = useRef(null)
  const frame = useRef(0)

  // Posición del mouse (-1 a 1 desde el centro) como variables CSS: así las fotos se mueven sin re-renderizar
  const setPointer = (x, y) => {
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      heroRef.current?.style.setProperty('--mx', x.toFixed(3))
      heroRef.current?.style.setProperty('--my', y.toFixed(3))
    })
  }

  const onPointerMove = (event) => {
    if (event.pointerType !== 'mouse' || !canMove()) return
    const box = heroRef.current.getBoundingClientRect()
    const x = ((event.clientX - box.left) / box.width) * 2 - 1
    const y = ((event.clientY - box.top) / box.height) * 2 - 1
    setPointer(x, y)
  }

  return (
    <section className="hero" ref={heroRef} onPointerMove={onPointerMove} onPointerLeave={() => setPointer(0, 0)}>
      <HeroCollage experiences={experiences} />
      <span className="eyebrow">Reservá experiencias únicas, estés donde estés</span>
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

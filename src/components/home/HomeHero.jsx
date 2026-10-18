import { useEffect, useState } from 'react'
import HeroSearch from '../search/HeroSearch'
import { getAvailableDates, getDestinations } from '../../utils/experiences'
import './HomeHero.css'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const WORDS = ['distinto.', 'en otra ciudad.', 'de noche.', 'con amigos.', 'al aire libre.', 'improvisado.']
const WORD_MS = 2600

/** "Hacé un plan ___": la última palabra va cambiando con una animación (queda fija si se pidió menos movimiento). */
function RotatingWord() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (reducedMotion()) return undefined
    const timer = setInterval(() => setIndex((current) => (current + 1) % WORDS.length), WORD_MS)
    return () => clearInterval(timer)
  }, [])

  return (
    <em className="hero__word" aria-hidden>
      <span key={index}>{WORDS[index]}</span>
    </em>
  )
}

/** Portada del inicio con el buscador grande. Al buscar avisa los filtros elegidos (onSearch). */
function HomeHero({ filters, experiences, sessions, onSearch }) {
  return (
    <section className="hero">
      <span className="eyebrow">Reservá experiencias únicas, estés donde estés</span>
      <h1>
        <span className="visually-hidden">Hacé un plan distinto.</span>
        <span aria-hidden>Hacé un plan</span> <RotatingWord />
      </h1>
      <p className="hero__lead">
        Elegí una experiencia, una fecha y reservá tu lugar.
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

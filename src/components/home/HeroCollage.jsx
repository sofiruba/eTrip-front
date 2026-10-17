import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import ImageWithFallback from '../ui/ImageWithFallback'
import { formatMoney } from '../../utils/format'
import { getCity } from '../../utils/location'
import './HeroCollage.css'

/**
 * Lugares de las tarjetas alrededor del título. `x` es la distancia (px) desde el centro del hero
 * hasta el borde de la tarjeta más cercano al texto; `depth` cuánto se mueve con el mouse.
 * Los de abajo quedan al costado del buscador, que es más ancho: por eso van más afuera.
 */
const SLOTS = [
  { side: 'left', top: '3%', x: 350, rot: -6, depth: 1.1, delay: 0 },
  { side: 'right', top: '1%', x: 340, rot: 5, depth: 0.7, delay: 0.8 },
  { side: 'left', top: '37%', x: 360, rot: 4, depth: 0.5, delay: 1.6 },
  { side: 'right', top: '35%', x: 350, rot: -4, depth: 1.2, delay: 2.4 },
  { side: 'left', top: '68%', x: 490, rot: -3, depth: 0.8, delay: 1.2 },
  { side: 'right', top: '66%', x: 490, rot: 6, depth: 0.6, delay: 2 },
]

/** Las mejores experiencias con foto, tratando de que sean de ciudades distintas. */
function pickExperiences(experiences) {
  const ranked = experiences
    .filter((experience) => experience.images?.[0])
    .toSorted(
      (a, b) =>
        Number(Boolean(b.nextSession)) - Number(Boolean(a.nextSession)) ||
        b.averageRating - a.averageRating ||
        b.reviewCount - a.reviewCount,
    )
  const cities = new Set()
  const varied = ranked.filter((experience) => {
    const city = getCity(experience.location)
    if (cities.has(city)) return false
    cities.add(city)
    return true
  })
  const rest = ranked.filter((experience) => !varied.includes(experience))
  return [...varied, ...rest].slice(0, SLOTS.length)
}

/**
 * Fotos de experiencias reales flotando alrededor del título de la home.
 * Se mueven con el mouse según las variables --mx / --my que pone HomeHero.
 * Es decorativo (las mismas experiencias están en el catálogo), así que no entra en el orden de tab.
 */
function HeroCollage({ experiences }) {
  const picks = useMemo(() => pickExperiences(experiences), [experiences])
  if (!picks.length) return null

  return (
    <div className="hero-collage" aria-hidden>
      {picks.map((experience, index) => {
        const { side, top, x, rot, depth, delay } = SLOTS[index]
        return (
          <Link
            key={experience.id}
            to={`/experiencias/${experience.id}`}
            tabIndex={-1}
            className={`hero-card hero-card--${side} hero-card--slot-${index}`}
            style={{ top, '--x': `${x}px`, '--rot': `${rot}deg`, '--depth': depth, '--delay': `${delay}s`, '--enter': `${index * 90}ms` }}
          >
            <span className="hero-card__float">
              <span className="hero-card__body">
                <ImageWithFallback src={experience.images[0]} className="hero-card__photo" />
                <span className="hero-card__info">
                  <strong>{experience.title}</strong>
                  <span>
                    {getCity(experience.location)} · {formatMoney(experience.finalPrice)}
                  </span>
                </span>
              </span>
            </span>
          </Link>
        )
      })}
    </div>
  )
}

export default HeroCollage

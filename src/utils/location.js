import { normalizeText } from './format'
import { cities } from '../data/cities'

/**
 * Las experiencias guardan su ubicación como "Barrio, Ciudad" en un solo texto
 * (campo `location` del back). El back busca con "contiene", así que filtrar
 * por ciudad es mandar el nombre de la ciudad en `location`.
 */

const parts = (location = '') =>
  location
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

/** "La Boca, Buenos Aires" → "Buenos Aires" */
export function getCity(location) {
  return parts(location).at(-1) ?? ''
}

/** "La Boca, Buenos Aires" → "La Boca" (vacío si solo hay ciudad) */
export function getArea(location) {
  const list = parts(location)
  return list.length > 1 ? list.slice(0, -1).join(', ') : ''
}

export function buildLocation(area, city) {
  return [area.trim(), city.trim()].filter(Boolean).join(', ')
}

export function findKnownCity(value) {
  const normalized = normalizeText(value?.trim() ?? '')
  return cities.find((city) => normalizeText(city.name) === normalized) ?? null
}

/** Igual que el back pero sin acentos: "cordoba" encuentra "Córdoba". */
export function matchesLocation(location, query) {
  return normalizeText(location).includes(normalizeText(query.trim()))
}

/** Distancia en km entre dos puntos { lat, lng } (fórmula de haversine). */
export function distanceKm(a, b) {
  const toRad = (degrees) => (degrees * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

/** La ciudad más cercana a `point` dentro de `cities`, con su distancia. */
export function findNearestCity(point, cities) {
  return cities
    .map((city) => ({ city, distance: distanceKm(point, city) }))
    .sort((a, b) => a.distance - b.distance)[0]
}

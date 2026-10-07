import { pluralize } from './format'

/**
 * Viajeros por edad y edad mínima de cada experiencia (`minAge` en el back).
 * Adultos: 18+ · Niños: 4 a 17 · Bebés: 0 a 3. Los bebés no ocupan lugar (van a upa).
 */

export const CHILD_MIN_AGE = 4
export const ADULT_AGE = 18
export const MAX_GUESTS = 20

export const GUEST_TYPES = [
  { id: 'adults', label: 'Adultos', detail: 'Desde 18 años' },
  { id: 'children', label: 'Niños', detail: 'De 4 a 17 años' },
  { id: 'infants', label: 'Bebés', detail: 'Hasta 3 años · no ocupan lugar' },
]

/** Opciones de edad mínima que elige el anfitrión. */
export const MIN_AGE_OPTIONS = [
  { value: 0, label: 'Todas las edades', detail: 'Pueden ir bebés y niños' },
  { value: CHILD_MIN_AGE, label: 'Desde 4 años', detail: 'No pueden ir bebés' },
  { value: 12, label: 'Desde 12 años', detail: 'Por ejemplo, actividades físicas exigentes' },
  { value: 16, label: 'Desde 16 años', detail: '' },
  { value: ADULT_AGE, label: 'Solo mayores de 18', detail: 'Por ejemplo, si hay alcohol' },
]

/** Lugares que ocupa el grupo (los bebés no cuentan). */
export const countSeats = ({ adults, children }) => (adults || 0) + (children || 0)

/**
 * Edad de la persona más chica del grupo, para el filtro `youngestAge` del back.
 * Como no sabemos la edad exacta de los niños, se toma la mínima de su rango.
 */
export function getYoungestAge({ children, infants }) {
  if (infants) return 0
  if (children) return CHILD_MIN_AGE
  return null
}

/** "2 adultos, 1 niño, 1 bebé" (vacío si no se eligió nadie). */
export function describeGuests({ adults, children, infants }) {
  return [
    adults && pluralize(adults, 'adulto'),
    children && pluralize(children, 'niño'),
    infants && pluralize(infants, 'bebé'),
  ]
    .filter(Boolean)
    .join(', ')
}

/** "Solo mayores de 18", "Desde 4 años" o "Todas las edades". */
export function describeMinAge(minAge) {
  if (!minAge) return 'Todas las edades'
  if (minAge >= ADULT_AGE) return 'Solo mayores de 18'
  return `Desde ${minAge} años`
}

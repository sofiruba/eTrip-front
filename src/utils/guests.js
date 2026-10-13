import { pluralize } from './format'

/**
 * Viajeros del buscador. Adultos: 18+ · Niños: 4 a 17 · Bebés: 0 a 3.
 * Los bebés no ocupan lugar (van a upa).
 */

export const MAX_GUESTS = 20

export const GUEST_TYPES = [
  { id: 'adults', label: 'Adultos', detail: 'Desde 18 años' },
  { id: 'children', label: 'Niños', detail: 'De 4 a 17 años' },
  { id: 'infants', label: 'Bebés', detail: 'Hasta 3 años · no ocupan lugar' },
]

/** Lugares que ocupa el grupo (los bebés no cuentan). */
export const countSeats = ({ adults, children }) => (adults || 0) + (children || 0)

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

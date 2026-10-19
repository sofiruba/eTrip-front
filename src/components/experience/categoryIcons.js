import { Bike, Landmark, Mountain, Music, Palette, Sparkles, Sprout, UtensilsCrossed } from 'lucide-react'
import { normalizeText } from '../../utils/format'

/**
 * Ícono de cada categoría. Se busca por palabra clave (sin acentos ni mayúsculas), así una categoría
 * que el admin cree con un nombre parecido ("Cocina", "Deportes acuáticos") también recibe su ícono.
 * Si no coincide con ninguna, usa uno genérico.
 */
const ICONS = [
  { keywords: ['aventura', 'naturaleza', 'trekking', 'escapada'], icon: Mountain },
  { keywords: ['deporte', 'aire libre', 'activo'], icon: Bike },
  { keywords: ['gastronom', 'cocina', 'comida', 'vino'], icon: UtensilsCrossed },
  { keywords: ['arte', 'creativ', 'taller'], icon: Palette },
  { keywords: ['cultura', 'local', 'historia', 'barrio'], icon: Landmark },
  { keywords: ['bienestar', 'social', 'yoga'], icon: Sprout },
  { keywords: ['musica', 'noche', 'tango'], icon: Music },
]

export function getCategoryIcon(name = '') {
  const text = normalizeText(name)
  return ICONS.find(({ keywords }) => keywords.some((keyword) => text.includes(keyword)))?.icon ?? Sparkles
}

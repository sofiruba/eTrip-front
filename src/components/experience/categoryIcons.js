import { Brush, Leaf, Music, Palette, Sparkles, TreePine, Utensils } from 'lucide-react'

const ICONS = {
  Gastronomía: Utensils,
  'Arte & salidas': Palette,
  Talleres: Brush,
  Escapadas: TreePine,
  Música: Music,
  Bienestar: Leaf,
}

/** Ícono de cada categoría (las nuevas creadas por admin usan uno genérico). */
export function getCategoryIcon(name) {
  return ICONS[name] ?? Sparkles
}

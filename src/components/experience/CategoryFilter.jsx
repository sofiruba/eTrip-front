import { Sparkles } from 'lucide-react'
import Chip from '../ui/Chip'
import { getCategoryIcon } from './categoryIcons'

/** Filtro por categoría. value = id de categoría o null para "Todas". */
function CategoryFilter({ categories, value, onChange }) {
  return (
    <div className="chip-list" role="group" aria-label="Filtrar por categoría">
      <Chip icon={Sparkles} selected={!value} onClick={() => onChange(null)}>
        Todas
      </Chip>
      {categories.map((category) => (
        <Chip
          key={category.id}
          icon={getCategoryIcon(category.name)}
          selected={value === category.id}
          onClick={() => onChange(category.id)}
        >
          {category.name}
        </Chip>
      ))}
    </div>
  )
}

export default CategoryFilter

import { useState } from 'react'
import ManagementHeader from '../components/ManagementHeader'

function CategoryManagementScreen({ onBack, onCreate, onEdit }) {
  const [categories, setCategories] = useState(['Gastronomía', 'Arte & salidas', 'Escapadas', 'Música', 'Bienestar'])
  return <main className="inner-page"><button className="back-button" onClick={onBack}>← Volver al panel</button><ManagementHeader eyebrow="ADMINISTRACIÓN" title="Categorías." description="Ordená cómo las personas descubren sus próximos planes." action="Nueva categoría" onAction={onCreate} /><div className="management-list">{categories.map((category) => <article className="management-row simple-row" key={category}><span className="category-dot">✦</span><strong>{category}</strong><small>12 experiencias</small><button className="row-action" onClick={() => onEdit(category)}>Editar</button><button className="row-delete" onClick={() => setCategories(categories.filter((item) => item !== category))}>Eliminar</button></article>)}</div></main>
}

export default CategoryManagementScreen

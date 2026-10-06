import { daysFromToday } from './dates'

// Forma de ReviewResponseDTO (experienceTitle y userName salen de las relaciones)
export const reviews = [
  { id: 1, experienceId: 1, userId: 6, rating: 5, comment: 'Una experiencia hermosa. Nico nos hizo descubrir lugares increíbles y las fotos quedaron geniales.', createdAt: daysFromToday(-14) },
  { id: 2, experienceId: 1, userId: 7, rating: 5, comment: 'Muy buena organización, el grupo fue genial y el vermut estuvo espectacular.', createdAt: daysFromToday(-30) },
  { id: 3, experienceId: 1, userId: 8, rating: 4, comment: 'Lindo recorrido. Me hubiese gustado un poco más de tiempo para sacar fotos.', createdAt: daysFromToday(-60) },
  { id: 4, experienceId: 2, userId: 6, rating: 5, comment: 'Salí con una taza horrible y feliz. Sofía tiene una paciencia infinita.', createdAt: daysFromToday(-22) },
  { id: 5, experienceId: 2, userId: 7, rating: 5, comment: 'El lugar es súper cálido y el té de hierbas, un golazo.', createdAt: daysFromToday(-24) },
  { id: 6, experienceId: 3, userId: 1, rating: 5, comment: 'Remar al atardecer en el Delta fue lo mejor que hice en el año. Santi explica todo con mucha calma.', createdAt: daysFromToday(-28) },
  { id: 7, experienceId: 3, userId: 6, rating: 5, comment: 'Nunca había hecho kayak y me sentí segura todo el tiempo.', createdAt: daysFromToday(-29) },
  { id: 8, experienceId: 4, userId: 7, rating: 5, comment: 'Adiviné solo una cepa, pero me reí toda la noche.', createdAt: daysFromToday(-13) },
  { id: 9, experienceId: 4, userId: 8, rating: 4, comment: 'Muy buenos vinos y explicaciones claras. Volvería.', createdAt: daysFromToday(-12) },
]

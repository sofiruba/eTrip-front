const categories = ['Todas', 'Gastronomía', 'Arte & salidas', 'Escapadas', 'Música', 'Bienestar']

const experiences = [
  { id: 1, title: 'Paseo por La Boca', subtitle: 'Fotografía analógica y vermut', host: 'Nico & Sofi', category: 'Arte & salidas', location: 'La Boca, CABA', date: 'Sáb 26 Oct · 16:00', price: 28000, spots: 3, rating: '4.9', image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=85', color: '#e9d7c4' },
  { id: 2, title: 'Pasta italiana casera', subtitle: 'Taller, degustación y vino', host: 'Marco Rossi', category: 'Gastronomía', location: 'Palermo Soho, CABA', date: 'Dom 27 Oct · 12:30', price: 25000, spots: 5, rating: '4.8', image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=900&q=85', color: '#e4ddd0' },
  { id: 3, title: 'Kayak al atardecer', subtitle: 'Remá, desconectá y disfrutá', host: 'Santi Ferrer', category: 'Escapadas', location: 'Tigre, Buenos Aires', date: 'Sáb 12 Oct · 18:30', price: 32000, spots: 7, rating: '5.0', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=85', color: '#ccdcd9' },
  { id: 4, title: 'Cata a ciegas', subtitle: 'Vinos naturales en Chacarita', host: 'Micaela G.', category: 'Gastronomía', location: 'Chacarita, CABA', date: 'Vie 11 Oct · 20:00', price: 18500, spots: 4, rating: '4.9', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=85', color: '#e1d2c5' },
]

const sessions = [
  { date: 'Sábado 26 de octubre', time: '16:00 hs', spots: 3 },
  { date: 'Sábado 2 de noviembre', time: '16:00 hs', spots: 8 },
  { date: 'Domingo 10 de noviembre', time: '11:00 hs', spots: 5 },
]

const reviews = [
  { name: 'Lucía M.', date: 'Hace 2 semanas', rating: 5, text: 'Una experiencia hermosa. Nico y Sofi nos hicieron descubrir lugares increíbles.' },
  { name: 'Martín R.', date: 'Hace 1 mes', rating: 5, text: 'Muy buena organización, el grupo fue genial y el vermut estuvo espectacular.' },
]

export { categories, experiences, sessions, reviews }

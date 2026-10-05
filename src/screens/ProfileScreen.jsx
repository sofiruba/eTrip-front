
import { useState } from 'react'
import { experiences } from '../data/mockData'

function Profile({ onNavigate, user, onUpdateInterests, reviewCount = 1, bookingCount = 4, interests = [] }) {
  const allInterests = [
    ['Arte', '◒'], ['Buceo', '⌁'], ['Cine', '▣'], ['Compras', '⌑'], ['Fotografía', '◉'],
    ['Gastronomía', '♨'], ['Juegos de mesa', '♟'], ['Museos', '▤'], ['Videojuegos', '⌘'], ['Naturaleza', '♧'],
  ]
  const completedPlans = [
    { ...experiences[0], completedDate: '26 de octubre de 2025' },
    { ...experiences[3], completedDate: '11 de octubre de 2025' },
    { ...experiences[2], completedDate: '12 de septiembre de 2025' },
  ]
  const [editing, setEditing] = useState(false)
  const [selectedInterests, setSelectedInterests] = useState(interests.length ? interests : ['Gastronomía', 'Naturaleza', 'Fotografía'])
  const toggleInterest = (interest) => setSelectedInterests((items) => items.includes(interest) ? items.filter((item) => item !== interest) : [...items, interest])
  const saveInterests = () => {
    if (!selectedInterests.length) return
    onUpdateInterests(selectedInterests)
    setEditing(false)
  }
  return <main className="inner-page"><div className="profile-dashboard"><section className="profile-hero"><span className="big-avatar">{user?.name?.slice(0, 2).toUpperCase() || 'SR'}</span><div><span className="intro-tag">TU PERFIL · CLIENTE</span><h1>{user?.name || 'Sofía Rubachin'}</h1><p>Buenos Aires · Se unió en 2025</p></div><button className="outline-button" onClick={() => onNavigate('host')}>Modo anfitrión</button></section><section className="profile-stats"><div><span>✦</span><strong>{bookingCount}</strong><small>reservas hechas</small></div><div><span>★</span><strong>{reviewCount}</strong><small>reseñas publicadas</small></div><div><span>♡</span><strong>12</strong><small>planes guardados</small></div><div><span>◷</span><strong>8</strong><small>horas disfrutadas</small></div></section><section className={`profile-interests ${editing ? 'editing' : ''}`}><div className="interests-heading"><span className="eyebrow">PARA CONOCERTE MEJOR</span><h2>¿Qué te gusta hacer?</h2><p>Elegí tus intereses y encontrá planes que se parezcan a vos.</p></div>{editing ? <div className="interest-editor"><div className="interest-options">{allInterests.map(([interest, icon]) => <button className={selectedInterests.includes(interest) ? 'selected' : ''} key={interest} onClick={() => toggleInterest(interest)}><span className="interest-icon">{icon}</span><strong>{interest}</strong><b>{selectedInterests.includes(interest) ? '✓' : '+'}</b></button>)}</div><div className="interest-editor-actions"><button className="text-button" onClick={() => setEditing(false)}>Cancelar</button><button className="primary-button" onClick={saveInterests}>Guardar cambios</button></div></div> : <div className="interest-tags">{selectedInterests.map((interest) => <span key={interest}>✦ {interest}</span>)}<button onClick={() => setEditing(true)}>Editar intereses</button></div>}</section><section className="plans-section"><div className="plans-heading"><div><span className="eyebrow">TU HISTORIAL</span><h2>Planes que hice</h2><p>Volvé a esos momentos o descubrí tu próximo favorito.</p></div><button className="text-button" onClick={() => onNavigate('bookings')}>Ver todas tus reservas →</button></div><div className="plans-grid">{completedPlans.map((plan) => <article className="completed-plan" key={plan.id}><img src={plan.image} alt={plan.title} /><div className="completed-plan-content"><div className="plan-rating">★ {plan.rating}</div><h3>{plan.title}</h3><p>{plan.subtitle}</p><small>Hecho el {plan.completedDate}</small><strong>${plan.price.toLocaleString('es-AR')} <span>por persona</span></strong></div></article>)}</div></section><section className="profile-activity"><div className="activity-heading"><div><span className="eyebrow">TU ACTIVIDAD</span><h2>Todo en un solo lugar</h2></div><button className="text-button" onClick={() => onNavigate('bookings')}>Ver reservas →</button></div><div className="activity-grid"><button onClick={() => onNavigate('bookings')}><span className="activity-icon">◷</span><strong>Próxima reserva</strong><small>Paseo por La Boca · 26 Oct</small><em>Ver voucher →</em></button><button onClick={() => onNavigate('reviews')}><span className="activity-icon">★</span><strong>Tu última reseña</strong><small>“Una experiencia hermosa...”</small><em>Ver mis reseñas →</em></button><button onClick={() => onNavigate('orders')}><span className="activity-icon">♧</span><strong>Historial de órdenes</strong><small>{bookingCount} compras confirmadas</small><em>Ver órdenes →</em></button></div></section></div></main> }

export default Profile

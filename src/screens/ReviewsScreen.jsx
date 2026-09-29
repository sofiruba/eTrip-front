import { reviews as initialReviews } from '../data/mockData'

function Reviews({ reviews = initialReviews, onNotify, onWrite }) {
  return <main className="inner-page"><div className="page-title reviews-heading"><div><span className="intro-tag">TU VOZ</span><h1>Mis <em>reseñas.</em></h1><p>Compartí lo que viviste y ayudá a otros a elegir.</p></div><button className="primary-button" onClick={onWrite}>Escribir reseña ＋</button></div>{reviews.length ? <div className="my-reviews-list">{reviews.map((review) => <article className="review-card" key={`${review.name}-${review.date}`}><div className="stars">{'★'.repeat(review.rating)}<span>{'★'.repeat(5 - review.rating)}</span></div><h2>Paseo por La Boca</h2><p>“{review.text}”</p><small>{review.name} · {review.date}</small><button onClick={() => onNotify('La reseña se puede editar desde el detalle')}>Editar reseña</button></article>)}</div> : <div className="empty-state"><div>✦</div><h2>Todavía no escribiste reseñas</h2><p>Después de vivir una experiencia, vas a poder contar cómo fue.</p></div>}</main>
}

export default Reviews

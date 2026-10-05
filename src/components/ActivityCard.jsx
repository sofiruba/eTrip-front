import ImageWithFallback from './ImageWithFallback'

function ActivityCard({ image, title, description }) {
  return <article className="activity-line"><ImageWithFallback src={image} alt="" /><div><strong>{title}</strong><p>{description}</p></div></article>
}

export default ActivityCard

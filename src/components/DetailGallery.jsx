import ImageWithFallback from './ImageWithFallback'

function DetailGallery({ images, title }) {
  return <div className="detail-gallery">{images.map((image, index) => <ImageWithFallback key={image} className={index === 0 ? 'gallery-main' : 'gallery-image'} src={image} alt={`${title} ${index + 1}`} />)}</div>
}

export default DetailGallery

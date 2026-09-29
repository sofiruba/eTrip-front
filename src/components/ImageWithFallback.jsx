import fallbackImage from '../assets/hero.png'

function ImageWithFallback({ src, alt, className, ...props }) {
  return (
    <img
      {...props}
      className={className}
      src={src}
      alt={alt}
      onError={(event) => {
        if (event.currentTarget.src !== fallbackImage) {
          event.currentTarget.src = fallbackImage
        }
      }}
    />
  )
}

export default ImageWithFallback

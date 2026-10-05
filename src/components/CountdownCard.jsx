import { useEffect, useState } from 'react'
import ImageWithFallback from './ImageWithFallback'

function getRemaining(target) {
  const difference = Math.max(0, new Date(target).getTime() - Date.now())
  return {
    days: Math.floor(difference / 86400000),
    hours: Math.floor((difference % 86400000) / 3600000),
    minutes: Math.floor((difference % 3600000) / 60000),
    finished: difference === 0,
  }
}

function CountdownCard({ target, compact = false, image, title = 'Tu próxima experiencia', location = 'Buenos Aires · Próximamente' }) {
  const [remaining, setRemaining] = useState(() => getRemaining(target))

  useEffect(() => {
    const interval = window.setInterval(() => setRemaining(getRemaining(target)), 60000)
    return () => window.clearInterval(interval)
  }, [target])

  if (remaining.finished) return <div className={`countdown-card ${compact ? 'compact' : ''}`}><span className="countdown-label">ESTA EXPERIENCIA YA PASÓ</span></div>

  return <div className={`countdown-card ${compact ? 'compact' : ''}`}>{image && <ImageWithFallback src={image} alt="" />}<div className="countdown-copy"><span className="countdown-label">TU PRÓXIMO PLAN</span><strong>{title}</strong><small>{location}</small></div><div className="countdown-units"><span><b>{remaining.days}</b><small>días</small></span><i>:</i><span><b>{String(remaining.hours).padStart(2, '0')}</b><small>hs</small></span><i>:</i><span><b>{String(remaining.minutes).padStart(2, '0')}</b><small>min</small></span></div></div>
}

export default CountdownCard

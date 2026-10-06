import { useEffect, useState } from 'react'

/** Tiempo restante hasta `target`, actualizado cada 30 segundos. */
export function useCountdown(target) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30000)
    return () => window.clearInterval(interval)
  }, [])

  const difference = Math.max(0, new Date(target).getTime() - now)
  return {
    days: Math.floor(difference / 86400000),
    hours: Math.floor((difference % 86400000) / 3600000),
    minutes: Math.floor((difference % 3600000) / 60000),
    finished: difference === 0,
  }
}

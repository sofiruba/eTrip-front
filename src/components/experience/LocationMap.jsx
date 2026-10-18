import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { getArea, getCity } from '../../utils/location'
import './LocationMap.css'

/**
 * Mapa aproximado de una experiencia ("Barrio, Ciudad").
 * Es el mismo embed de Google de siempre; el look minimalista (tonos neutros, sin la tarjeta de arriba,
 * halo con el color de la marca) es solo CSS por encima. Si el mapa no carga, se muestra un aviso.
 */
function LocationMap({ location }) {
  const [failed, setFailed] = useState(false)
  const label = [getArea(location), getCity(location)].filter(Boolean).join(', ') || location
  const url = `https://www.google.com/maps?q=${encodeURIComponent(label)}&z=14&output=embed`

  return (
    <div className="location-map">
      {failed ? (
        <div className="location-map__fallback">
          <MapPin size={24} aria-hidden />
          <strong>Ubicación aproximada no disponible</strong>
        </div>
      ) : (
        <div className="location-map__frame">
          <iframe
            title={`Mapa de ${label}`}
            src={url}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            onError={() => setFailed(true)}
          />
          <span className="location-map__halo" aria-hidden />
          <div className="location-map__label">
            <MapPin size={16} aria-hidden />
            <strong>{label}</strong>
          </div>
        </div>
      )}
      <small className="muted">Zona aproximada. Te enviamos el punto exacto al confirmar la reserva.</small>
    </div>
  )
}

export default LocationMap

import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { getArea, getCity } from '../../utils/location'
import './LocationMap.css'

/**
 * Mapa aproximado de una experiencia ("Barrio, Ciudad").
 * Google ubica el marcador en el punto de referencia del barrio, sin mostrar una dirección exacta.
 * Si el mapa no carga, se muestra un aviso en su lugar.
 */
function LocationMap({ location }) {
  const [failed, setFailed] = useState(false)
  const label = [getArea(location), getCity(location)].filter(Boolean).join(', ') || location
  const url = `https://www.google.com/maps?q=${encodeURIComponent(label)}&z=14&output=embed`

  return (
    <div className="location-map">
      <iframe
        title={`Mapa de ${label}`}
        src={url}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        onError={() => setFailed(true)}
        hidden={failed}
      />
      {failed && (
        <div className="location-map__fallback">
          <MapPin size={24} aria-hidden />
          <strong>Ubicación aproximada no disponible</strong>
        </div>
      )}
      <div className="location-map__label">
        <MapPin size={18} aria-hidden />
        <strong>{label}</strong>
      </div>
      <small className="muted">Te enviamos el punto exacto al confirmar la reserva.</small>
    </div>
  )
}

export default LocationMap

import FormField from '../ui/FormField'
import CityField from './CityField'

/** Ciudad (con sugerencias) y barrio. En el back se guardan juntos: "Palermo, Buenos Aires". */
function LocationFields({ city, area, errors, onChange }) {
  return (
    <div className="form-grid">
      <CityField value={city} error={errors.city} onChange={(value) => onChange('city', value)} />
      <FormField
        label="Barrio o zona"
        value={area}
        onChange={(event) => onChange('area', event.target.value)}
        error={errors.area}
        placeholder="Palermo"
        required
        hint="Barrio y ciudad, sin dirección exacta."
      />
    </div>
  )
}

export default LocationFields

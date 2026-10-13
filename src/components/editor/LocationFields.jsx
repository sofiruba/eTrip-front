import { cities } from '../../data/cities'
import FormField from '../ui/FormField'

/** Ciudad (con sugerencias) y barrio. En el back se guardan juntos: "Palermo, Buenos Aires". */
function LocationFields({ city, area, errors, onChange }) {
  return (
    <>
      <FormField
        label="Ciudad"
        value={city}
        onChange={(event) => onChange('city', event.target.value)}
        error={errors.city}
        placeholder="Buenos Aires"
        list="editor-cities"
        required
        autoComplete="off"
      />
      <datalist id="editor-cities">
        {cities.map((entry) => (
          <option key={entry.name} value={entry.name}>
            {entry.country}
          </option>
        ))}
      </datalist>
      <FormField
        label="Barrio o zona"
        value={area}
        onChange={(event) => onChange('area', event.target.value)}
        error={errors.area}
        placeholder="Palermo"
        required
        hint="El punto exacto se lo mandás a quien reserve. Así se busca: “Palermo, Buenos Aires”."
      />
    </>
  )
}

export default LocationFields

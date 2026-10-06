import { interestOptions } from '../../data'
import Chip from '../ui/Chip'

/** Selector de intereses (registro y perfil). */
function InterestPicker({ value, onChange }) {
  const toggle = (interest) =>
    onChange(value.includes(interest) ? value.filter((item) => item !== interest) : [...value, interest])

  return (
    <div className="chip-list">
      {interestOptions.map((interest) => (
        <Chip key={interest} selected={value.includes(interest)} showCheck onClick={() => toggle(interest)}>
          {interest}
        </Chip>
      ))}
    </div>
  )
}

export default InterestPicker

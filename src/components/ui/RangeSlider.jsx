import './RangeSlider.css'

/**
 * Slider con dos manijas (mínimo y máximo). Son dos <input type="range"> superpuestos, así funciona con
 * mouse, touch y teclado sin librerías. `value` = [desde, hasta].
 * onChange se llama mientras se arrastra; onCommit al soltar (ahí recién se aplica el filtro, para no
 * llenar el historial del navegador con un cambio por cada píxel).
 */
function RangeSlider({ min, max, step = 1, value, onChange, onCommit, labels = ['Mínimo', 'Máximo'], formatValue = String }) {
  const [low, high] = value
  const percent = (number) => ((number - min) / (max - min || 1)) * 100

  const commitEvents = { onPointerUp: onCommit, onKeyUp: onCommit, onBlur: onCommit }

  return (
    <div className="range-slider" style={{ '--from': `${percent(low)}%`, '--to': `${percent(high)}%` }}>
      <span className="range-slider__track" aria-hidden>
        <span className="range-slider__fill" />
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={low}
        aria-label={labels[0]}
        aria-valuetext={formatValue(low)}
        // Si las dos manijas quedan juntas a la derecha, la de "desde" va arriba para poder moverla
        className={low > max - (max - min) / 10 ? 'is-front' : ''}
        onChange={(event) => onChange([Math.min(Number(event.target.value), high), high])}
        {...commitEvents}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={high}
        aria-label={labels[1]}
        aria-valuetext={formatValue(high)}
        onChange={(event) => onChange([low, Math.max(Number(event.target.value), low)])}
        {...commitEvents}
      />
    </div>
  )
}

export default RangeSlider

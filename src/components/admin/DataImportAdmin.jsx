import { useState } from 'react'
import { CircleAlert, CircleCheck, CircleMinus, Download, FileUp, Upload } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import sampleData from '../../data/sampleData.json'
import { fetchCategories } from '../../redux/categoriesSlice'
import { fetchCoupons } from '../../redux/couponsSlice'
import { fetchAllExperiences, fetchExperiences } from '../../redux/experiencesSlice'
import { importData } from '../../redux/importSlice'
import { fetchManagedSessions, fetchSessions } from '../../redux/sessionsSlice'
import { fetchUsers } from '../../redux/usersSlice'
import { showToast } from '../../redux/toastsSlice'
import Button from '../ui/Button'
import FormField from '../ui/FormField'
import Notice from '../ui/Notice'
import './DataImportAdmin.css'

const SAMPLE_TEXT = JSON.stringify(sampleData, null, 2)
const LOG_ICONS = { ok: CircleCheck, skip: CircleMinus, error: CircleAlert }

/**
 * Carga datos de prueba desde un JSON (categorías, cupones, usuarios con sus experiencias y fechas).
 * No toca el back: usa los mismos endpoints que el resto de la app (ver redux/importSlice.js).
 * El progreso (`log`) está en el estado global: cada paso que termina se ve acá enseguida.
 */
function DataImportAdmin() {
  const dispatch = useDispatch()
  const { log, running } = useSelector((state) => state.dataImport)
  const [text, setText] = useState(SAMPLE_TEXT)
  const [error, setError] = useState('')

  // Lee un archivo .json elegido por el usuario
  const loadFile = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    file
      .text()
      .then((content) => {
        setText(content)
        setError('')
      })
      .catch(() => setError('No pudimos leer el archivo.'))
  }

  const downloadSample = () => {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([SAMPLE_TEXT], { type: 'application/json' }))
    link.download = 'datos-de-prueba.json'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const runImport = () => {
    let data
    try {
      data = JSON.parse(text)
    } catch {
      return setError('El texto no es un JSON válido. Revisá comas, comillas y llaves.')
    }
    setError('')
    // Si algo falla, queda anotado en el log (estado global)
    return dispatch(importData(data)).then((action) => {
      if (action.error) return dispatch(showToast({ message: 'La carga no terminó: revisá el detalle', tone: 'error' }))
      // Se crearon muchas cosas de una en el back: es el único caso en el que volvemos a pedir el catálogo y las listas del panel
      dispatch(fetchCategories())
      dispatch(fetchExperiences())
      dispatch(fetchSessions())
      dispatch(fetchAllExperiences())
      dispatch(fetchManagedSessions())
      dispatch(fetchCoupons())
      dispatch(fetchUsers())
      return dispatch(showToast({ message: 'Carga terminada' }))
    })
  }

  return (
    <div className="stack data-import">
      <Notice tone="info">
        Crea categorías, cupones, usuarios y las experiencias (con fechas) de cada usuario. Lo que ya existe se saltea, así que se
        puede cargar varias veces. Las fechas se calculan desde hoy con <code>inDays</code> y <code>time</code>; si una
        experiencia no trae <code>image</code>, se usa una foto de ejemplo.
      </Notice>

      <div className="row">
        <Button variant="secondary" icon={Upload} onClick={() => setText(SAMPLE_TEXT)}>
          Usar el ejemplo
        </Button>
        <label className="btn btn--secondary btn--md data-import__file">
          <FileUp size={18} aria-hidden />
          Subir archivo .json
          <input type="file" accept="application/json,.json" onChange={loadFile} />
        </label>
        <Button variant="ghost" icon={Download} onClick={downloadSample}>
          Descargar ejemplo
        </Button>
      </div>

      <FormField
        as="textarea"
        label="Datos (JSON)"
        rows={16}
        value={text}
        error={error}
        spellCheck={false}
        className="data-import__json"
        onChange={(event) => setText(event.target.value)}
      />

      <div>
        <Button onClick={runImport} disabled={running}>
          {running ? 'Cargando...' : 'Cargar datos'}
        </Button>
      </div>

      {log.length > 0 && (
        <ol className="card data-import__log" aria-live="polite">
          {log.map((entry, index) => {
            const Icon = LOG_ICONS[entry.type]
            return (
              <li key={index} className={`is-${entry.type}`}>
                <Icon size={16} aria-hidden />
                <span>{entry.message}</span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

export default DataImportAdmin

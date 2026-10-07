import { useEffect, useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import ExperienceCard from '../components/experience/ExperienceCard'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import FormField, { FormActions } from '../components/ui/FormField'
import PageHeader from '../components/ui/PageHeader'
import { cities } from '../data/cities'
import { findById } from '../data/selectors'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useStore } from '../hooks/useStore'
import { useToast } from '../hooks/useToast'
import { useUnsavedChanges } from '../hooks/useUnsavedChanges'
import { fullName } from '../utils/format'
import { MIN_AGE_OPTIONS } from '../utils/guests'
import { buildLocation, getArea, getCity } from '../utils/location'
import { getFinalPrice } from '../utils/orders'
import NotFoundPage from './NotFoundPage'
import './ExperienceEditorPage.css'

const MAX_PHOTOS = 5
const MAX_PHOTO_MB = 5
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const toForm = (experience, defaultCategoryId) => ({
  title: experience?.title ?? '',
  subtitle: experience?.subtitle ?? '',
  description: experience?.description ?? '',
  categoryId: experience?.categoryId ?? defaultCategoryId,
  // En el back es un solo campo `location` ("Barrio, Ciudad"); acá se edita por separado
  city: experience ? getCity(experience.location) : '',
  area: experience ? getArea(experience.location) : '',
  price: experience?.price ?? '',
  discountPercentage: experience?.discountPercentage ?? 0,
  durationHours: experience?.durationHours ?? 2,
  minAge: experience?.minAge ?? 0,
  includes: experience?.includes?.join('\n') ?? '',
  images: experience?.images ?? [],
})

function validate(form) {
  const errors = {}
  if (form.title.trim().length < 5) errors.title = 'Usá al menos 5 caracteres.'
  if (!form.subtitle.trim()) errors.subtitle = 'Sumá una frase corta que la describa.'
  if (form.description.trim().length < 30) errors.description = 'Contá un poco más (mínimo 30 caracteres).'
  if (!form.city.trim()) errors.city = 'Indicá la ciudad.'
  if (form.city.includes(',')) errors.city = 'Solo el nombre de la ciudad (sin comas).'
  if (!form.area.trim()) errors.area = 'Indicá el barrio o la zona.'
  if (!(Number(form.price) > 0)) errors.price = 'Ingresá un precio mayor a 0.'
  if (Number(form.discountPercentage) < 0 || Number(form.discountPercentage) > 90) errors.discountPercentage = 'Entre 0 y 90%.'
  if (!form.images.length) errors.images = 'Subí al menos una foto.'
  return errors
}

function ExperienceEditorPage() {
  const { id } = useParams()
  const { db, create, update } = useStore()
  const { user } = useAuth()
  const notify = useToast()
  const navigate = useNavigate()
  const existing = id ? findById(db.experiences, id) : null
  const [initialForm] = useState(() => toForm(existing, db.categories[0]?.id))
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const createdUrls = useRef([])
  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm)
  const { blocker, allowLeave } = useUnsavedChanges(dirty)
  useDocumentTitle(existing ? `Editar ${existing.title}` : 'Nueva experiencia')

  // Liberar las URLs temporales de las fotos al salir
  useEffect(() => () => createdUrls.current.forEach(URL.revokeObjectURL), [])

  if (id && (!existing || existing.publisherId !== user.id)) {
    return <NotFoundPage title="No encontramos esta experiencia" text="Solo podés editar experiencias que publicaste vos." />
  }

  const setField = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  // Al conectar el back, los File van en un FormData (POST /experiences es multipart/form-data)
  const addPhotos = (event) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    const valid = files.filter((file) => PHOTO_TYPES.includes(file.type) && file.size <= MAX_PHOTO_MB * 1024 * 1024)
    const room = MAX_PHOTOS - form.images.length
    const problems = []
    if (valid.length < files.length) problems.push(`Solo JPG, PNG o WEBP de hasta ${MAX_PHOTO_MB} MB.`)
    if (valid.length > room) problems.push(`Máximo ${MAX_PHOTOS} fotos: agregamos ${room}.`)
    setErrors({ ...errors, images: problems.join(' ') || undefined })

    const urls = valid.slice(0, room).map((file) => URL.createObjectURL(file))
    createdUrls.current.push(...urls)
    setForm({ ...form, images: [...form.images, ...urls] })
  }

  const removePhoto = (url) => setForm({ ...form, images: form.images.filter((image) => image !== url) })

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const { city, area, ...fields } = form
    const data = {
      ...fields,
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      description: form.description.trim(),
      location: buildLocation(area, city),
      categoryId: Number(form.categoryId),
      price: Number(form.price),
      discountPercentage: Number(form.discountPercentage),
      durationHours: Number(form.durationHours),
      minAge: Number(form.minAge),
      includes: form.includes.split('\n').map((line) => line.trim()).filter(Boolean),
    }

    if (existing) {
      update('experiences', existing.id, data)
      notify('Cambios guardados')
    } else {
      create('experiences', { ...data, publisherId: user.id })
      notify('¡Experiencia publicada! Ahora sumale fechas desde el calendario.')
    }
    createdUrls.current = [] // las fotos guardadas siguen en uso
    allowLeave()
    navigate('/anfitrion/experiencias')
  }

  const preview = {
    ...form,
    id: existing?.id ?? 0,
    price: Number(form.price) || 0,
    discountPercentage: Number(form.discountPercentage) || 0,
    finalPrice: getFinalPrice({ price: Number(form.price) || 0, discountPercentage: Number(form.discountPercentage) || 0 }),
    publisherName: fullName(user),
    location: buildLocation(form.area || 'Tu barrio', form.city || 'Tu ciudad'),
    subtitle: form.subtitle || 'Una frase que invite a sumarse',
    averageRating: 0,
    reviewCount: 0,
    nextSession: null,
    upcomingCount: 0,
    minAge: Number(form.minAge) || 0,
  }

  return (
    <div className="container page">
      <PageHeader
        back={{ to: '/anfitrion/experiencias', label: 'Mis experiencias' }}
        eyebrow={existing ? 'Editar experiencia' : 'Nueva experiencia'}
        title={existing ? 'Editá tu' : 'Creá algo'}
        accent={existing ? 'experiencia.' : 'inolvidable.'}
        description="Contá qué hace especial a tu plan y ayudá a otras personas a encontrarlo."
      />

      <div className="split editor">
        <form className="stack" onSubmit={handleSubmit} noValidate>
          <EditorSection
            step="01"
            title="Fotos"
            description={`Es lo primero que van a ver. Hasta ${MAX_PHOTOS} imágenes; la primera es la portada.`}
          >
            <div className="editor__photos">
              {form.images.map((url, index) => (
                <div key={url} className="editor__photo">
                  <img src={url} alt="" />
                  {index === 0 && <span className="editor__cover">Portada</span>}
                  <button type="button" aria-label="Quitar foto" onClick={() => removePhoto(url)}>
                    <X size={14} aria-hidden />
                  </button>
                </div>
              ))}
              {form.images.length < MAX_PHOTOS && (
                <label className="editor__upload">
                  <input type="file" accept={PHOTO_TYPES.join(',')} multiple onChange={addPhotos} />
                  <ImagePlus size={24} aria-hidden />
                  <span>Agregar fotos</span>
                </label>
              )}
            </div>
            {errors.images && <p className="form-error">{errors.images}</p>}
          </EditorSection>

          <EditorSection step="02" title="Contá tu plan" description="Una buena historia invita a sumarse.">
            <FormField label="Título" value={form.title} onChange={setField('title')} error={errors.title} placeholder="Ej: Paseo por La Boca y vermut" />
            <FormField label="Bajada" value={form.subtitle} onChange={setField('subtitle')} error={errors.subtitle} placeholder="Ej: Fotografía analógica y vermut" />
            <FormField
              as="textarea"
              label="Descripción"
              rows={5}
              value={form.description}
              onChange={setField('description')}
              error={errors.description}
              placeholder="¿Qué van a hacer? ¿Qué la hace única?"
            />
            <FormField
              as="textarea"
              label="Qué incluye"
              rows={3}
              value={form.includes}
              onChange={setField('includes')}
              hint="Un ítem por línea."
              placeholder={'Materiales\nAlgo para tomar'}
            />
            <div className="form-grid">
              <FormField as="select" label="Categoría" value={form.categoryId} onChange={setField('categoryId')}>
                {db.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </FormField>
              <FormField
                label="Ciudad"
                value={form.city}
                onChange={setField('city')}
                error={errors.city}
                placeholder="Buenos Aires"
                list="editor-cities"
                autoComplete="off"
              />
              <datalist id="editor-cities">
                {cities.map((city) => (
                  <option key={city.name} value={city.name}>
                    {city.country}
                  </option>
                ))}
              </datalist>
            </div>
            <FormField
              label="Barrio o zona"
              value={form.area}
              onChange={setField('area')}
              error={errors.area}
              placeholder="Palermo"
              hint="El punto exacto se lo mandás a quien reserve. Así se busca: “Palermo, Buenos Aires”."
            />
          </EditorSection>

          <EditorSection step="03" title="Precio, duración y edades" description="Podés cambiarlo cuando quieras.">
            <div className="form-grid">
              <FormField label="Precio por persona ($)" type="number" min="0" value={form.price} onChange={setField('price')} error={errors.price} />
              <FormField
                label="Descuento (%)"
                type="number"
                min="0"
                max="90"
                value={form.discountPercentage}
                onChange={setField('discountPercentage')}
                error={errors.discountPercentage}
              />
              <FormField label="Duración (horas)" type="number" min="0.5" step="0.5" value={form.durationHours} onChange={setField('durationHours')} />
              <FormField
                as="select"
                label="¿Quiénes pueden ir?"
                value={form.minAge}
                onChange={setField('minAge')}
                hint={MIN_AGE_OPTIONS.find((option) => option.value === Number(form.minAge))?.detail}
              >
                {MIN_AGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </FormField>
            </div>
          </EditorSection>

          <FormActions
            onCancel={() => navigate('/anfitrion/experiencias')}
            submitLabel={existing ? 'Guardar cambios' : 'Publicar experiencia'}
          />
        </form>

        <aside className="editor__preview">
          <span className="eyebrow">Vista previa</span>
          <ExperienceCard experience={preview} to={null} showFavorite={false} />
          <p className="muted small">Así se va a ver en el listado.</p>
        </aside>
      </div>

      {blocker.state === 'blocked' && (
        <ConfirmDialog
          title="¿Salir sin guardar?"
          message="Tenés cambios sin guardar en esta experiencia. Si salís ahora, se pierden."
          confirmLabel="Salir sin guardar"
          onConfirm={() => blocker.proceed()}
          onClose={() => blocker.state === 'blocked' && blocker.reset()}
        />
      )}
    </div>
  )
}

function EditorSection({ step, title, description, children }) {
  return (
    <section className="card editor__section">
      <header className="editor__section-header">
        <span>{step}</span>
        <div>
          <h2>{title}</h2>
          <p className="muted small">{description}</p>
        </div>
      </header>
      {children}
    </section>
  )
}

export default ExperienceEditorPage

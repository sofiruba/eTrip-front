import { useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import EditorPreview from '../components/editor/EditorPreview'
import EditorSection from '../components/editor/EditorSection'
import LocationFields from '../components/editor/LocationFields'
import PhotoPicker, { MAX_PHOTOS } from '../components/editor/PhotoPicker'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import FormField, { FormActions } from '../components/ui/FormField'
import Loading from '../components/ui/Loading'
import PageHeader from '../components/ui/PageHeader'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useToast } from '../hooks/useToast'
import { useUnsavedChanges } from '../hooks/useUnsavedChanges'
import { getCategories } from '../services/categoriesService'
import { createExperience, getExperience, updateDiscount, updateExperience } from '../services/experiencesService'
import { toFile, toForm, validate } from '../utils/experienceForm'
import { buildLocation } from '../utils/location'
import NotFoundPage from './NotFoundPage'

/** Crear (/nueva) o editar (/:id/editar) una experiencia. */
function ExperienceEditorPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const notify = useToast()
  const navigate = useNavigate()
  const [existing, setExisting] = useState(null)
  const [categories, setCategories] = useState([])
  const [initialForm, setInitialForm] = useState(() => toForm(null))
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(Boolean(id))
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm)
  const { blocker, allowLeave } = useUnsavedChanges(dirty && !saving)
  useDocumentTitle(existing ? `Editar ${existing.title}` : 'Nueva experiencia')

  // Las categorías para el select
  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data))
      .catch((error) => console.error('Error al traer las categorías:', error))
  }, [])

  // Si estamos editando, traemos la experiencia y cargamos el formulario con sus datos
  useEffect(() => {
    if (!id) return
    getExperience(id)
      .then((data) => {
        setExisting(data)
        setInitialForm(toForm(data))
        setForm(toForm(data))
      })
      .catch(() => setNotFound(true))
      .then(() => setLoading(false))
  }, [id])

  if (loading) return <Loading />
  if (notFound || (existing && existing.publisherId !== user.id)) {
    return <NotFoundPage title="No encontramos esta experiencia" text="Solo podés editar experiencias que publicaste vos." />
  }

  const changeField = (field, value) => setForm({ ...form, [field]: value })
  const setField = (field) => (event) => changeField(field, event.target.value)

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    // Mismos campos que ExperienceRequestDTO
    const data = {
      title: form.title.trim(),
      description: form.description.trim(),
      location: buildLocation(form.area, form.city),
      categoryId: Number(form.categoryId),
      price: Number(form.price),
    }
    const discount = Number(form.discountPercentage)
    // El back reemplaza TODAS las fotos cuando recibe alguna: si cambiaron, mandamos todas las que quedaron.
    // Promise.all espera a que se conviertan todas antes de seguir.
    const photosChanged = JSON.stringify(form.images) !== JSON.stringify(initialForm.images)
    const photos = photosChanged ? Promise.all(form.images.map(toFile)) : Promise.resolve([])

    setSaving(true)
    photos
      .then((files) => (existing ? updateExperience(existing.id, data, files) : createExperience(data, files)))
      // El descuento tiene su propio endpoint (PATCH): solo lo llamamos si cambió
      .then((saved) => (discount !== saved.discountPercentage ? updateDiscount(saved.id, discount) : saved))
      .then((saved) => {
        notify(existing ? 'Cambios guardados' : '¡Experiencia publicada! Ahora sumale fechas desde el calendario.')
        allowLeave()
        navigate(existing ? '/anfitrion/experiencias' : `/anfitrion/calendario?experiencia=${saved.id}`)
      })
      .catch((saveError) => {
        setErrors({ form: saveError.message })
        setSaving(false)
      })
  }

  return (
    <div className="container page">
      <PageHeader
        back={{ to: '/anfitrion/experiencias', label: 'Mis experiencias' }}
        eyebrow={existing ? 'Editar experiencia' : 'Nueva experiencia'}
        title={existing ? 'Editá tu' : 'Creá algo'}
        accent={existing ? 'experiencia.' : 'inolvidable.'}
        description={
          existing
            ? 'Contá qué hace especial a tu plan y gestioná sus fechas desde el calendario.'
            : 'Contá qué hace especial a tu plan. Al publicarlo vas a poder agregar sus fechas y horarios.'
        }
        actions={
          existing ? (
            <Button icon={CalendarDays} variant="secondary" to={`/anfitrion/calendario?experiencia=${existing.id}`}>
              Gestionar fechas
            </Button>
          ) : null
        }
      />

      <div className="split">
        <form className="stack" onSubmit={handleSubmit} noValidate>
          <EditorSection step="01" title="Fotos" description={`Es lo primero que van a ver. Hasta ${MAX_PHOTOS} imágenes; la primera es la portada.`}>
            <PhotoPicker images={form.images} onChange={(images) => changeField('images', images)} error={errors.images} />
          </EditorSection>

          <EditorSection step="02" title="Contá tu plan" description="Una buena historia invita a sumarse.">
            <FormField label="Título" value={form.title} onChange={setField('title')} error={errors.title} placeholder="Ej: Paseo por La Boca y vermut" />
            <FormField
              as="textarea"
              label="Descripción"
              rows={5}
              value={form.description}
              onChange={setField('description')}
              error={errors.description}
              placeholder="¿Qué van a hacer? ¿Qué la hace única?"
            />
            <div className="form-grid">
              <FormField as="select" label="Categoría" value={form.categoryId} onChange={setField('categoryId')} error={errors.categoryId}>
                <option value="">Elegí una categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </FormField>
            </div>
            <LocationFields city={form.city} area={form.area} errors={errors} onChange={changeField} />
          </EditorSection>

          <EditorSection step="03" title="Precio" description="Podés cambiarlo cuando quieras. La duración se define en cada fecha.">
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
            </div>
          </EditorSection>

          <FormActions onCancel={() => navigate('/anfitrion/experiencias')} submitLabel={existing ? 'Guardar cambios' : 'Publicar y gestionar fechas'} />
          {errors.form && <p className="form-error">{errors.form}</p>}
        </form>

        <EditorPreview form={form} user={user} />
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

export default ExperienceEditorPage

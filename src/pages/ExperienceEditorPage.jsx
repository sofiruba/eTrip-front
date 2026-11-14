import { useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
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
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useUnsavedChanges } from '../hooks/useUnsavedChanges'
import { selectIsAdmin, selectUser } from '../redux/authSlice'
import { createExperience, fetchExperienceById, updateDiscount, updateExperience } from '../redux/experiencesSlice'
import { showToast } from '../redux/toastsSlice'
import { toFile, toForm, validate } from '../utils/experienceForm'
import { getDestinations } from '../utils/experiences'
import { buildLocation, canonicalCity } from '../utils/location'
import NotFoundPage from './NotFoundPage'

/**
 * Crear (/nueva) o editar (/:id/editar) una experiencia.
 * Esta parte trae la experiencia que se edita y decide qué mostrar; el formulario está en <ExperienceForm>.
 */
function ExperienceEditorPage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const user = useSelector(selectUser)
  const isAdmin = useSelector(selectIsAdmin)
  // La experiencia con todas sus fotos (el catálogo solo tiene la portada): { item, loading, error }
  const detail = useSelector((state) => (id ? state.experiences.details[id] : null))

  // Si estamos editando, la pedimos (si ya estaba en el store, no se repite el GET)
  useEffect(() => {
    if (id) dispatch(fetchExperienceById(id))
  }, [id, dispatch])

  if (id && (!detail || detail.loading)) return <Loading />
  const experience = detail?.item ?? null
  // Solo el dueño o un admin pueden editarla (el back también lo controla)
  if (detail?.error || (experience && experience.publisherId !== user.id && !isAdmin)) {
    return <NotFoundPage title="No encontramos esta experiencia" text="Solo podés editar experiencias que publicaste vos." />
  }

  // El formulario arranca con los datos de la experiencia (o vacío, si es nueva)
  return <ExperienceForm experience={experience} />
}

function ExperienceForm({ experience }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const isAdmin = useSelector(selectIsAdmin)
  // El admin edita desde su panel y vuelve ahí; el anfitrión, desde Mis experiencias
  const backTo = isAdmin ? '/admin/experiencias' : '/anfitrion/experiencias'
  // Las categorías del select y las ciudades ya están en el store
  const categories = useSelector((state) => state.categories.items)
  const experiences = useSelector((state) => state.experiences.items)
  // Si la acabamos de crear y falló el PATCH del descuento, la seguimos editando: el reintento hace PUT y no la duplica
  const [createdId, setCreatedId] = useState(null)
  const created = useSelector((state) => (createdId ? state.experiences.details[createdId]?.item : null))
  const existing = experience ?? created ?? null
  const [initialForm, setInitialForm] = useState(() => toForm(experience))
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm)
  const { blocker, allowLeave } = useUnsavedChanges(dirty && !saving)
  useDocumentTitle(existing ? `Editar ${existing.title}` : 'Nueva experiencia')

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
      // "cordoba" se guarda como "Córdoba" si ya existe así; una ciudad nueva se guarda como la escribió
      location: buildLocation(form.area, canonicalCity(form.city, getDestinations(experiences).map((city) => city.name))),
      categoryId: Number(form.categoryId),
      price: Number(form.price),
      adultsOnly: form.adultsOnly,
    }
    const discount = Number(form.discountPercentage)
    // El back reemplaza TODAS las fotos cuando recibe alguna: si cambiaron, mandamos todas las que quedaron.
    // Promise.all espera a que se conviertan todas antes de seguir.
    const photosChanged = JSON.stringify(form.images) !== JSON.stringify(initialForm.images)
    const photos = photosChanged ? Promise.all(form.images.map(toFile)) : Promise.resolve([])

    if (saving) return // mientras se guarda, un segundo clic no manda otra experiencia
    setSaving(true)
    const isNew = !existing
    // POST (nueva) o PUT (editar). Los reducers la guardan en el store: el Home y el buscador ya la muestran sin otro GET
    const save = (files) =>
      existing
        ? dispatch(updateExperience({ id: existing.id, experience: data, photos: files })).unwrap()
        : dispatch(createExperience({ experience: data, photos: files })).unwrap()
    photos
      .then(save)
      .then((saved) => {
        // Si la creamos recién, la recordamos: si el PATCH de descuento falla y se reintenta, se edita (PUT) y no se duplica
        if (isNew) {
          setCreatedId(saved.id)
          setInitialForm(form)
        }
        // El descuento tiene su propio endpoint (PATCH): solo lo llamamos si cambió
        return discount !== saved.discountPercentage
          ? dispatch(updateDiscount({ id: saved.id, discountPercentage: discount })).unwrap()
          : saved
      })
      .then((saved) => {
        dispatch(showToast(isNew ? '¡Experiencia publicada! Ahora sumale fechas desde el calendario.' : 'Cambios guardados'))
        allowLeave()
        navigate(isNew ? `/anfitrion/calendario?experiencia=${saved.id}` : backTo)
      })
      .catch((saveError) => {
        setErrors({ form: saveError.message })
        setSaving(false)
      })
  }

  return (
    <div className="container page">
      <PageHeader
        back={{ to: backTo, label: isAdmin ? 'Experiencias del panel' : 'Mis experiencias' }}
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
            <Button
              icon={CalendarDays}
              variant="secondary"
              to={isAdmin ? `/admin/sesiones?experiencia=${existing.id}` : `/anfitrion/calendario?experiencia=${existing.id}`}
            >
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
            <label className="checkbox">
              <input type="checkbox" checked={form.adultsOnly} onChange={(event) => changeField('adultsOnly', event.target.checked)} />
              Solo para mayores de 18 (si alguien busca con niños o bebés, no la ve)
            </label>
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

          <FormActions
            onCancel={() => navigate(backTo)}
            submitLabel={existing ? 'Guardar cambios' : 'Publicar y gestionar fechas'}
            submitting={saving}
          />
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

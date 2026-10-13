import { findKnownCity, getArea, getCity } from './location'

/** Datos del formulario del editor a partir de una experiencia (o vacío si es nueva). */
export const toForm = (experience) => ({
  title: experience?.title ?? '',
  description: experience?.description ?? '',
  categoryId: experience?.categoryId ?? '',
  // En el back es un solo campo `location` ("Barrio, Ciudad"); acá se edita por separado
  city: experience ? getCity(experience.location) : '',
  area: experience ? getArea(experience.location) : '',
  price: experience?.price ?? '',
  discountPercentage: experience?.discountPercentage ?? 0,
  images: experience?.images ?? [],
})

/** Errores del formulario: { campo: mensaje }. Vacío si está todo bien. */
export function validate(form) {
  const errors = {}
  if (form.title.trim().length < 5) errors.title = 'Usá al menos 5 caracteres.'
  if (!form.categoryId) errors.categoryId = 'Elegí una categoría.'
  if (form.description.trim().length < 30) errors.description = 'Contá un poco más (mínimo 30 caracteres).'
  if (!form.city.trim()) errors.city = 'Indicá la ciudad.'
  else if (form.city.includes(',')) errors.city = 'Solo el nombre de la ciudad (sin comas).'
  else if (!findKnownCity(form.city)) errors.city = 'Elegí una ciudad válida de la lista.'
  if (!form.area.trim()) errors.area = 'Indicá el barrio o la zona.'
  else if (form.area.includes(',')) errors.area = 'Escribí solo el nombre del barrio o zona, sin comas.'
  else if (/^[\d\s.-]+$/.test(form.area.trim())) errors.area = 'Ingresá un barrio o zona válida, no una dirección.'
  if (!(Number(form.price) > 0)) errors.price = 'Ingresá un precio mayor a 0.'
  if (Number(form.discountPercentage) < 0 || Number(form.discountPercentage) > 90) errors.discountPercentage = 'Entre 0 y 90%.'
  if (!form.images.length) errors.images = 'Subí al menos una foto.'
  return errors
}

/** Una foto del formulario como File: las nuevas ya lo son; las que vinieron del back (base64) se convierten. */
export const toFile = (image, index) =>
  image.file
    ? Promise.resolve(image.file)
    : fetch(image)
        .then((response) => response.blob())
        .then((blob) => new File([blob], `foto-${index + 1}.jpg`, { type: blob.type }))

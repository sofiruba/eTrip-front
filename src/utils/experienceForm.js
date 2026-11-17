import { getArea, getCity } from './location'

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
  adultsOnly: experience?.adultsOnly ?? false,
  tags: experience?.tags ?? [],
  images: experience?.images ?? [],
})

/** Hasta cuántos intereses puede tener una experiencia (el back valida lo mismo). */
export const MAX_TAGS = 8

/** Errores del formulario: { campo: mensaje }. Vacío si está todo bien. */
export function validate(form) {
  const errors = {}
  if (form.title.trim().length < 5) errors.title = 'Usá al menos 5 caracteres.'
  if (!form.categoryId) errors.categoryId = 'Elegí una categoría.'
  if (form.description.trim().length < 30) errors.description = 'Contá un poco más (mínimo 30 caracteres).'
  if (!form.city.trim()) errors.city = 'Indicá la ciudad.'
  else if (form.city.includes(',')) errors.city = 'Solo el nombre de la ciudad (sin comas).'
  // El back valida lo mismo sobre `location`; acá es para avisar antes de mandar
  else if (/\d/.test(form.city)) errors.city = 'Escribí solo el nombre de la ciudad, sin números.'
  else if (form.city.trim().length < 2 || !/\p{L}/u.test(form.city)) errors.city = 'Escribí el nombre de la ciudad.'
  if (!form.area.trim()) errors.area = 'Indicá el barrio o la zona.'
  else if (form.area.includes(',')) errors.area = 'Escribí solo el nombre del barrio o zona, sin comas.'
  else if (/^[\d\s.-]+$/.test(form.area.trim())) errors.area = 'Ingresá un barrio o zona válida, no una dirección.'
  if (!(Number(form.price) > 0)) errors.price = 'Ingresá un precio mayor a 0.'
  if (Number(form.discountPercentage) < 0 || Number(form.discountPercentage) > 90) errors.discountPercentage = 'Entre 0 y 90%.'
  if (!form.images.length) errors.images = 'Subí al menos una foto.'
  return errors
}

/** "data:image/jpeg;base64,..." → File. Se decodifica acá mismo: no se le pide nada a ningún servidor. */
function dataUrlToFile(dataUrl, name) {
  const [header, base64] = dataUrl.split(',')
  const type = header.match(/^data:(.*?);/)?.[1] ?? 'image/jpeg'
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
  return new File([bytes], name, { type })
}

/** Una foto del formulario como File: las nuevas ya lo son; las que vinieron del back (base64) se convierten. */
export const toFile = (image, index) => Promise.resolve(image.file ?? dataUrlToFile(image, `foto-${index + 1}.jpg`))

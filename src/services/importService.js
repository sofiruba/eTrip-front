import { request } from './api'
import { toFormData } from './experiencesService'
import { addHours, daysFromToday } from '../utils/dates'

/**
 * Carga un set de datos de prueba (JSON) usando los endpoints que ya existen en el back.
 * Orden: categorías y cupones (como admin) → usuarios → experiencias y fechas de cada usuario
 * (con el token de ese usuario, así queda como anfitrión). Lo que ya existe se saltea,
 * así se puede cargar el mismo archivo varias veces.
 *
 * `log(texto, tipo)` informa cada paso: tipo 'ok' | 'skip' | 'error'.
 */
export function importData(data, log) {
  const categoryIds = {} // nombre en minúscula → id

  return request('/experience-categories')
    .then((page) => page.content.forEach((category) => (categoryIds[category.name.toLowerCase()] = category.id)))
    .then(() => inOrder(data.categories, (category) => importCategory(category, categoryIds, log)))
    .then(() => request('/discount-coupons'))
    .then((page) => inOrder(data.coupons, (coupon) => importCoupon(coupon, page.content, log)))
    .then(() => inOrder(data.users, (user) => importUser(user, categoryIds, log)))
}

/** Ejecuta `fn` para cada elemento, de a uno: espera que termine el anterior antes de seguir. */
function inOrder(items = [], fn) {
  return items.reduce((previous, item) => previous.then(() => fn(item)), Promise.resolve())
}

function importCategory(category, categoryIds, log) {
  if (categoryIds[category.name.toLowerCase()]) return log(`Categoría "${category.name}" ya existía`, 'skip')
  return request('/experience-categories', 'POST', category)
    .then((saved) => {
      categoryIds[saved.name.toLowerCase()] = saved.id
      log(`Categoría "${saved.name}" creada`, 'ok')
    })
    .catch((error) => log(`Categoría "${category.name}": ${error.message}`, 'error'))
}

function importCoupon(coupon, existing, log) {
  if (existing.some((entry) => entry.code === coupon.code)) return log(`Cupón ${coupon.code} ya existía`, 'skip')
  // Si no se indican, vale desde hoy y por 90 días
  const body = { active: true, validFrom: daysFromToday(0, '00:00'), validUntil: daysFromToday(90, '23:59'), ...coupon }
  return request('/discount-coupons', 'POST', body)
    .then((saved) => log(`Cupón ${saved.code} creado (${saved.percentage}%)`, 'ok'))
    .catch((error) => log(`Cupón ${coupon.code}: ${error.message}`, 'error'))
}

function importUser(user, categoryIds, log) {
  const { username, firstname, lastname, email, password } = user
  // null = sin token: el registro y el login son públicos
  return request('/api/v1/auth/register', 'POST', { username, firstname, lastname, email, password }, null)
    .then((response) => {
      log(`Usuario ${email} creado`, 'ok')
      return response.access_token
    })
    // Si ya existía, iniciamos sesión con la misma contraseña para seguir con sus experiencias
    .catch(() =>
      request('/api/v1/auth/authenticate', 'POST', { usernameOrEmail: email, password }, null).then((response) => {
        log(`Usuario ${email} ya existía`, 'skip')
        return response.access_token
      }),
    )
    .then((token) =>
      request('/experiences/mine', 'GET', undefined, token).then((page) =>
        inOrder(user.experiences, (experience) => importExperience(experience, page.content, token, categoryIds, log)),
      ),
    )
    .catch((error) => log(`Usuario ${email}: ${error.message}`, 'error'))
}

function importExperience(experience, mine, token, categoryIds, log) {
  if (mine.some((entry) => entry.title === experience.title)) return log(`  Experiencia "${experience.title}" ya existía`, 'skip')

  const categoryId = categoryIds[(experience.category ?? '').toLowerCase()]
  if (!categoryId) return log(`  Experiencia "${experience.title}": no existe la categoría "${experience.category}"`, 'error')

  return getPhoto(experience)
    .then((photo) => request('/experiences', 'POST', toFormData({ ...experience, categoryId }, [photo]), token))
    .then((saved) => {
      log(`  Experiencia "${saved.title}" creada`, 'ok')
      if (!experience.discountPercentage) return saved
      return request(`/experiences/${saved.id}/discount`, 'PATCH', { discountPercentage: experience.discountPercentage }, token).then(() => saved)
    })
    .then((saved) => inOrder(experience.sessions, (session) => importSession(session, saved, token, log)))
    .catch((error) => log(`  Experiencia "${experience.title}": ${error.message}`, 'error'))
}

function importSession(session, experience, token, log) {
  // `startsAt` exacto, o `inDays` + `time` (relativo a hoy: así las fechas siempre son futuras)
  const startsAt = session.startsAt ?? daysFromToday(session.inDays ?? 7, session.time ?? '18:00')
  const body = { experienceId: experience.id, startsAt, endsAt: addHours(startsAt, session.hours ?? 2), capacity: session.capacity ?? 10 }
  return request('/experience-sessions', 'POST', body, token)
    .then(() => log(`    Fecha ${startsAt.slice(0, 16).replace('T', ' ')} creada`, 'ok'))
    .catch((error) => log(`    Fecha de "${experience.title}": ${error.message}`, 'error'))
}

/** Foto de la experiencia: si el JSON trae `image` (URL), la descarga; si no (o falla), dibuja una con el título. */
function getPhoto(experience) {
  const placeholder = () => drawPlaceholder(experience.title)
  if (!experience.image) return placeholder()
  return fetch(experience.image)
    .then((response) => {
      if (!response.ok) throw new Error('No se pudo descargar la foto')
      return response.blob()
    })
    .then((blob) => new File([blob], 'foto.jpg', { type: blob.type }))
    .catch(placeholder)
}

function drawPlaceholder(title) {
  const canvas = document.createElement('canvas')
  canvas.width = 900
  canvas.height = 600
  const context = canvas.getContext('2d')
  // Un color distinto por título
  const hue = [...title].reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % 360
  context.fillStyle = `hsl(${hue} 55% 55%)`
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#fff'
  context.font = 'bold 56px sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(title, canvas.width / 2, canvas.height / 2, canvas.width - 80)
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(new File([blob], 'foto.jpg', { type: 'image/jpeg' })), 'image/jpeg', 0.85))
}

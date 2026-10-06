/**
 * Validaciones de tarjetas para el checkout simulado.
 * Son las mismas reglas que aplica cualquier pasarela antes de enviar el pago:
 * marca por prefijo (BIN), largo según la marca, dígito verificador (Luhn),
 * vencimiento y código de seguridad.
 */

export const CARD_BRANDS = {
  visa: { name: 'Visa', lengths: [13, 16, 19], cvv: 3, gaps: [4, 8, 12] },
  mastercard: { name: 'Mastercard', lengths: [16], cvv: 3, gaps: [4, 8, 12] },
  amex: { name: 'American Express', lengths: [15], cvv: 4, gaps: [4, 10] },
}

export const ACCEPTED_BRANDS = ['visa', 'mastercard', 'amex']

/** Tarjeta de prueba que el "banco" rechaza siempre. */
export const DECLINED_TEST_CARD = '4000000000000002'

const MAX_YEARS_AHEAD = 20

export const onlyDigits = (value = '') => value.replace(/\D/g, '')

const inRange = (digits, size, min, max) => {
  if (digits.length < size) return false
  const prefix = Number(digits.slice(0, size))
  return prefix >= min && prefix <= max
}

export function detectBrand(value) {
  const digits = onlyDigits(value)
  if (!digits) return null
  if (/^3[47]/.test(digits)) return 'amex'
  if (/^4/.test(digits)) return 'visa'
  if (/^5[1-5]/.test(digits) || inRange(digits, 4, 2221, 2720)) return 'mastercard'
  return null
}

export function maxCardLength(brand) {
  return brand ? Math.max(...CARD_BRANDS[brand].lengths) : 19
}

/** "4242424242424242" → "4242 4242 4242 4242" (Amex: 4-6-5). */
export function formatCardNumber(value) {
  const brand = detectBrand(value)
  const digits = onlyDigits(value).slice(0, maxCardLength(brand))
  const gaps = brand ? CARD_BRANDS[brand].gaps : [4, 8, 12, 16]
  return digits.replace(/./g, (digit, index) => (gaps.includes(index) ? ` ${digit}` : digit))
}

/** Algoritmo de Luhn: detecta errores de tipeo en el número. */
export function passesLuhn(digits) {
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let digit = Number(digits[digits.length - 1 - i])
    if (i % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return digits.length > 0 && sum % 10 === 0
}

/** "1228" → "12/28" mientras se tipea. */
export function formatExpiry(value, previous = '') {
  const digits = onlyDigits(value).slice(0, 4)
  // Si borraron la barra, no la volvemos a poner al instante.
  if (previous.endsWith('/') && value.length < previous.length) return digits.slice(0, 1)
  if (digits.length === 1 && Number(digits) > 1) return `0${digits}/`
  if (digits.length >= 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return digits
}

export function parseExpiry(value) {
  const [month, year] = value.split('/').map((part) => Number(part))
  return { month, year: year + 2000 }
}

export function validateCardNumber(value) {
  const digits = onlyDigits(value)
  if (!digits) return 'Ingresá el número de la tarjeta.'
  const brand = detectBrand(digits)
  if (!brand) return 'No reconocemos esta tarjeta. Aceptamos Visa, Mastercard y Amex.'
  if (!CARD_BRANDS[brand].lengths.includes(digits.length)) {
    const lengths = CARD_BRANDS[brand].lengths
    const options = lengths.length > 1 ? `${lengths.slice(0, -1).join(', ')} o ${lengths.at(-1)}` : lengths[0]
    return `Una tarjeta ${CARD_BRANDS[brand].name} tiene ${options} dígitos.`
  }
  if (!passesLuhn(digits)) return 'El número de tarjeta no es válido. Revisalo.'
  return ''
}

export function validateExpiry(value, today = new Date()) {
  if (!value) return 'Ingresá el vencimiento.'
  if (!/^\d{2}\/\d{2}$/.test(value)) return 'Usá el formato MM/AA.'
  const { month, year } = parseExpiry(value)
  if (month < 1 || month > 12) return 'El mes tiene que estar entre 01 y 12.'
  const currentMonth = today.getFullYear() * 12 + today.getMonth() + 1
  const cardMonth = year * 12 + month
  if (cardMonth < currentMonth) return 'La tarjeta está vencida.'
  if (year > today.getFullYear() + MAX_YEARS_AHEAD) return 'El año de vencimiento no es válido.'
  return ''
}

export function validateCvv(value, brand) {
  const size = brand ? CARD_BRANDS[brand].cvv : 3
  if (!value) return 'Ingresá el código de seguridad.'
  if (!new RegExp(`^\\d{${size}}$`).test(value)) return `El código tiene ${size} dígitos${size === 4 ? ' (está en el frente)' : ''}.`
  return ''
}

export function validateHolder(value) {
  const name = value.trim()
  if (!name) return 'Ingresá el nombre como figura en la tarjeta.'
  if (!/^[\p{L}' .-]+$/u.test(name)) return 'Usá solo letras.'
  if (name.split(/\s+/).length < 2) return 'Ingresá nombre y apellido.'
  return ''
}

export function validatePostalCode(value, country) {
  const code = value.trim().toUpperCase()
  if (!code) return 'Ingresá el código postal.'
  if (country === 'AR' && !/^(\d{4}|[A-Z]\d{4}[A-Z]{3})$/.test(code)) return 'Usá 4 dígitos (1425) o el CPA (C1425ABC).'
  if (!/^[A-Z0-9 -]{3,10}$/.test(code)) return 'El código postal no es válido.'
  return ''
}

export function validateCard(card) {
  const brand = detectBrand(card.number)
  const errors = {
    number: validateCardNumber(card.number),
    expiry: validateExpiry(card.expiry),
    cvv: validateCvv(card.cvv, brand),
    holder: validateHolder(card.holder),
    postalCode: validatePostalCode(card.postalCode, card.country),
  }
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message))
}

/** Lo único que se guarda de una tarjeta: nunca el número completo ni el CVV. */
export function toSavedCard(card) {
  const digits = onlyDigits(card.number)
  const { month, year } = parseExpiry(card.expiry)
  return {
    id: `${detectBrand(digits)}-${digits.slice(-4)}-${month}-${year}`,
    brand: detectBrand(digits),
    last4: digits.slice(-4),
    expMonth: month,
    expYear: year,
    holder: card.holder.trim(),
  }
}

export function isCardExpired(card, today = new Date()) {
  return card.expYear * 12 + card.expMonth < today.getFullYear() * 12 + today.getMonth() + 1
}

/** "Visa •••• 4242" */
export function cardLabel(card) {
  return `${CARD_BRANDS[card.brand]?.name ?? 'Tarjeta'} •••• ${card.last4}`
}

/** "08/28" */
export function cardExpiry(card) {
  return `${String(card.expMonth).padStart(2, '0')}/${String(card.expYear).slice(-2)}`
}

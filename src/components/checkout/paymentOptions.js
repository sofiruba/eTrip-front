/** Datos compartidos por el form de pago y el checkout. */

export const COUNTRIES = [
  { code: 'AR', name: 'Argentina' },
  { code: 'BR', name: 'Brasil' },
  { code: 'CL', name: 'Chile' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'ES', name: 'España' },
]

export const EMPTY_CARD = { number: '', expiry: '', cvv: '', holder: '', postalCode: '', country: 'AR', save: true }

/** Billeteras simuladas: solo cambian el texto de la pantalla de procesamiento. */
export const WALLETS = [
  { id: 'mercadopago', name: 'Mercado Pago', logo: 'mp' },
  { id: 'paypal', name: 'PayPal', logo: 'P' },
  { id: 'gpay', name: 'Google Pay', logo: 'G Pay' },
]

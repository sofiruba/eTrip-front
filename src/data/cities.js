/**
 * Ciudades conocidas, con coordenadas para "Cerca tuyo". Empezamos en Buenos Aires,
 * pero la idea es que haya experiencias en cualquier ciudad: si un anfitrión escribe
 * una ciudad que no está acá, igual se puede buscar por texto.
 * La ubicación de cada experiencia se guarda como "Barrio, Ciudad" (campo `location` del back).
 */
export const cities = [
  { name: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lng: -58.3816 },
  { name: 'Córdoba', country: 'Argentina', lat: -31.4201, lng: -64.1888 },
  { name: 'Rosario', country: 'Argentina', lat: -32.9442, lng: -60.6505 },
  { name: 'Mendoza', country: 'Argentina', lat: -32.8895, lng: -68.8458 },
  { name: 'Mar del Plata', country: 'Argentina', lat: -38.0055, lng: -57.5426 },
  { name: 'Bariloche', country: 'Argentina', lat: -41.1335, lng: -71.3103 },
  { name: 'Salta', country: 'Argentina', lat: -24.7821, lng: -65.4232 },
  { name: 'Ushuaia', country: 'Argentina', lat: -54.8019, lng: -68.303 },
  { name: 'Montevideo', country: 'Uruguay', lat: -34.9011, lng: -56.1645 },
  { name: 'Santiago', country: 'Chile', lat: -33.4489, lng: -70.6693 },
  { name: 'Río de Janeiro', country: 'Brasil', lat: -22.9068, lng: -43.1729 },
  { name: 'Lima', country: 'Perú', lat: -12.0464, lng: -77.0428 },
  { name: 'Bogotá', country: 'Colombia', lat: 4.711, lng: -74.0721 },
  { name: 'Ciudad de México', country: 'México', lat: 19.4326, lng: -99.1332 },
  { name: 'Madrid', country: 'España', lat: 40.4168, lng: -3.7038 },
  { name: 'Barcelona', country: 'España', lat: 41.3874, lng: 2.1686 },
  { name: 'Roma', country: 'Italia', lat: 41.9028, lng: 12.4964 },
  { name: 'París', country: 'Francia', lat: 48.8566, lng: 2.3522 },
  { name: 'Lisboa', country: 'Portugal', lat: 38.7223, lng: -9.1393 },
  { name: 'Nueva York', country: 'Estados Unidos', lat: 40.7128, lng: -74.006 },
]

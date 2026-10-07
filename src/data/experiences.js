import laBocaImage from '../assets/experiences/la-boca.jpg'
import ceramicaImage from '../assets/experiences/ceramica.jpg'
import kayakImage from '../assets/experiences/kayak.jpg'
import cataImage from '../assets/experiences/cata.jpg'

/**
 * Entidad Experience tal como la guardaría el back.
 * Los campos calculados del DTO (finalPrice, categoryName, publisherName,
 * averageRating, reviewCount) se arman en selectors.js.
 * `minAge`: edad mínima (0 = todas las edades; 18 si hay alcohol).
 * `images` son las URLs de las fotos. Al crear o editar, el back las recibe como
 * archivos en un multipart/form-data (no en base64).
 */
export const experiences = [
  {
    id: 1,
    title: 'Paseo por La Boca',
    minAge: 18,
    subtitle: 'Fotografía analógica y vermut',
    description:
      'Recorremos Caminito y los rincones que no salen en las postales con una cámara analógica en la mano. Te enseñamos lo básico para sacar buenas fotos y cerramos en un bodegón con un vermut.',
    price: 28000,
    discountPercentage: 0,
    location: 'La Boca, Buenos Aires',
    durationHours: 3,
    images: [laBocaImage],
    categoryId: 2,
    publisherId: 3,
    includes: ['Cámara analógica y rollo de 24 fotos', 'Vermut con picada', 'Revelado digital de tus fotos'],
  },
  {
    id: 2,
    title: 'Taller de cerámica',
    minAge: 4,
    subtitle: 'Modelado a mano y té de hierbas',
    description:
      'Una tarde para desenchufarse y crear tu propia taza o bowl desde cero. No hace falta experiencia: te acompañamos paso a paso y después horneamos tu pieza para que la retires.',
    price: 24000,
    discountPercentage: 0,
    location: 'Villa Crespo, Buenos Aires',
    durationHours: 2.5,
    images: [ceramicaImage],
    categoryId: 3,
    publisherId: 1,
    includes: ['Arcilla y herramientas', 'Horneado de tu pieza', 'Té y algo dulce'],
  },
  {
    id: 3,
    title: 'Kayak al atardecer',
    minAge: 12,
    subtitle: 'Remá, desconectá y disfrutá',
    description:
      'Salimos desde Tigre a recorrer los arroyos del Delta mientras baja el sol. Ideal para principiantes: antes de salir hacemos una práctica en aguas tranquilas.',
    price: 32000,
    discountPercentage: 10,
    location: 'Tigre, Buenos Aires',
    durationHours: 3,
    images: [kayakImage],
    categoryId: 4,
    publisherId: 5,
    includes: ['Kayak, remo y chaleco', 'Guía certificado', 'Mate y snacks a la vuelta'],
  },
  {
    id: 4,
    title: 'Cata a ciegas',
    minAge: 18,
    subtitle: 'Vinos naturales en Chacarita',
    description:
      'Probamos cinco vinos naturales sin ver la etiqueta y jugamos a adivinar cepa, región y precio. Una forma divertida de aprender a tomar vino sin solemnidad.',
    price: 18500,
    discountPercentage: 0,
    location: 'Chacarita, Buenos Aires',
    durationHours: 2,
    images: [cataImage],
    categoryId: 1,
    publisherId: 4,
    includes: ['5 copas de vino natural', 'Tabla de quesos', 'Ficha de cata para llevarte'],
  },
]

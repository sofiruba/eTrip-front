import { Mail } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { FREE_CANCELLATION_HOURS } from '../utils/cancellation'
import './InfoPage.css'

const CONTACT_EMAIL = 'hola@plan.com'

const SECTIONS = [
  {
    id: 'reservas',
    title: 'Reservas',
    questions: [
      {
        q: '¿Cómo reservo una experiencia?',
        a: 'Entrá a la experiencia, elegí una fecha y cuántas personas van, y agregala al carrito. Desde el carrito pasás al pago y, cuando se confirma, te llegan los vouchers.',
      },
      {
        q: '¿Puedo reservar varias experiencias juntas?',
        a: 'Sí. El carrito junta todas las fechas que agregues y las pagás en una sola orden. Cada fecha genera su propio voucher.',
      },
      {
        q: '¿Qué pasa si una fecha se agota?',
        a: 'Te lo marcamos en el listado y en el carrito, y no vas a poder pagarla. Si ya la tenías en el carrito, podés ajustar la cantidad a los lugares que quedan o quitarla.',
      },
      {
        q: '¿Dónde veo mis vouchers?',
        a: 'En Mis reservas. Mostrá el código al anfitrión cuando llegues; también podés imprimirlo desde el detalle de la reserva.',
      },
    ],
  },
  {
    id: 'cancelaciones',
    title: 'Cancelaciones y reembolsos',
    questions: [
      {
        q: '¿Puedo cancelar una reserva?',
        a: `Sí, con reembolso total si faltan más de ${FREE_CANCELLATION_HOURS} horas para la experiencia. Lo pedís desde el detalle de la reserva. Pasado ese plazo, la reserva ya no es reembolsable.`,
      },
      {
        q: '¿Cuánto tarda el reembolso?',
        a: 'Entre 5 y 10 días hábiles, según tu medio de pago. Si usaste un cupón, se devuelve la parte proporcional de lo que pagaste.',
      },
    ],
  },
  {
    id: 'pagos',
    title: 'Pagos y cupones',
    questions: [
      {
        q: '¿Qué medios de pago aceptan?',
        a: 'Tarjetas de crédito y débito Visa, Mastercard y American Express, y billeteras virtuales. Nunca guardamos el número completo de tu tarjeta ni el código de seguridad.',
      },
      {
        q: '¿Cómo uso un cupón de descuento?',
        a: 'En el paso de pago, escribí el código en el campo de cupón. El descuento se aplica sobre el total de la orden.',
      },
    ],
  },
  {
    id: 'anfitriones',
    title: 'Ser anfitrión',
    questions: [
      {
        q: '¿Quién puede publicar experiencias?',
        a: 'Cualquier persona con cuenta. Entrá al modo anfitrión, creá tu experiencia con fotos, descripción, categoría y precio, y después sumale fechas con los cupos disponibles.',
      },
      {
        q: '¿Puedo poner mi experiencia en oferta?',
        a: 'Sí. Desde Mis experiencias podés aplicar un descuento a cada una; el precio con descuento se ve en el listado y en el detalle.',
      },
      {
        q: '¿Puedo eliminar una experiencia?',
        a: 'Sí, siempre que no tenga reservas próximas. Si las tiene, primero tienen que pasar o cancelarse.',
      },
    ],
  },
]

function HelpPage() {
  useDocumentTitle('Ayuda')

  return (
    <div className="container page page--narrow info-page">
      <PageHeader eyebrow="Centro de ayuda" title="¿En qué te" accent="ayudamos?" description="Las dudas más comunes sobre reservas, pagos y anfitriones." />

      <nav className="info-page__toc" aria-label="Temas">
        {SECTIONS.map((section) => (
          <a key={section.id} href={`#${section.id}`}>
            {section.title}
          </a>
        ))}
      </nav>

      {SECTIONS.map((section) => (
        <section key={section.id} id={section.id} className="section">
          <h2>{section.title}</h2>
          <div className="faq">
            {section.questions.map(({ q, a }) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}

      <section className="section card info-page__contact">
        <div>
          <h2>¿No encontraste lo que buscabas?</h2>
          <p className="muted">Escribinos y te respondemos en menos de 24 horas hábiles.</p>
        </div>
        <a className="btn btn--secondary btn--md" href={`mailto:${CONTACT_EMAIL}`}>
          <Mail size={18} aria-hidden />
          {CONTACT_EMAIL}
        </a>
      </section>
    </div>
  )
}

export default HelpPage

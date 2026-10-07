import { Link } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { FREE_CANCELLATION_HOURS } from '../utils/cancellation'
import './InfoPage.css'

const UPDATED_AT = '1 de octubre de 2026'

const DOCUMENTS = {
  terminos: {
    title: 'Términos y condiciones',
    sections: [
      {
        title: 'Qué es PLAN',
        text: 'PLAN es una plataforma que conecta a personas que ofrecen experiencias (anfitriones) con personas que quieren reservarlas. PLAN no organiza las experiencias: cada anfitrión es responsable de lo que publica y de cumplir con lo que ofrece.',
      },
      {
        title: 'Cuentas',
        text: 'Para reservar o publicar necesitás una cuenta con datos reales. Sos responsable de cuidar tu contraseña y de la actividad que se haga con tu cuenta. Podemos suspender cuentas que incumplan estos términos.',
      },
      {
        title: 'Reservas y pagos',
        text: 'Una reserva queda confirmada cuando se aprueba el pago y se generan los vouchers. Los precios se muestran en pesos argentinos, por persona, con los descuentos vigentes ya aplicados.',
      },
      {
        title: 'Cancelaciones',
        text: `Podés cancelar con reembolso total hasta ${FREE_CANCELLATION_HOURS} horas antes del inicio de la experiencia. Después de ese plazo la reserva no es reembolsable, salvo que el anfitrión cancele la fecha.`,
      },
      {
        title: 'Publicaciones',
        text: 'Los anfitriones se comprometen a publicar información veraz (descripción, fotos, precio, ubicación y cupos) y a mantener actualizado el stock de lugares de cada fecha. No se puede eliminar una experiencia con reservas próximas.',
      },
    ],
  },
  privacidad: {
    title: 'Política de privacidad',
    sections: [
      {
        title: 'Qué datos guardamos',
        text: 'Tu nombre, apellido, nombre de usuario, email, tus reservas, reseñas, favoritos y las experiencias que publiques. Si guardás una tarjeta, solo conservamos la marca, los últimos 4 dígitos y el vencimiento.',
      },
      {
        title: 'Para qué los usamos',
        text: 'Para gestionar tus reservas, enviarte los vouchers, mostrarte experiencias que te puedan interesar y que los anfitriones sepan quién asiste. No vendemos tus datos.',
      },
      {
        title: 'Qué ven otros usuarios',
        text: 'Tu nombre aparece en las reseñas que escribís. Si sos anfitrión, tu perfil público muestra tu nombre, tu bio y tus experiencias. Los anfitriones ven el nombre de quienes reservan sus fechas.',
      },
      {
        title: 'Tus derechos',
        text: 'Podés pedir acceso, corrección o eliminación de tus datos escribiéndonos. Algunos datos de órdenes se conservan por obligaciones legales.',
      },
    ],
  },
}

/** Páginas legales estáticas: doc = 'terminos' | 'privacidad'. */
function LegalPage({ doc }) {
  const { title, sections } = DOCUMENTS[doc]
  useDocumentTitle(title)

  return (
    <div className="container page page--narrow info-page">
      <PageHeader eyebrow="Legales" title={title} description={`Última actualización: ${UPDATED_AT}.`} />
      {sections.map((section, index) => (
        <section key={section.title} className="info-page__legal">
          <h2>
            {index + 1}. {section.title}
          </h2>
          <p>{section.text}</p>
        </section>
      ))}
      <p className="muted small info-page__footnote">
        ¿Dudas? Mirá el <Link to="/ayuda">centro de ayuda</Link>.
      </p>
    </div>
  )
}

export default LegalPage

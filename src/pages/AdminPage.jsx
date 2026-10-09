import { CalendarCheck, CalendarDays, LayoutGrid, MessageSquare, Receipt, Store, Tags, TicketPercent, Users } from 'lucide-react'
import { useParams } from 'react-router-dom'
import AdminOverview from '../components/admin/AdminOverview'
import BookingsAdmin from '../components/admin/BookingsAdmin'
import CategoriesAdmin from '../components/admin/CategoriesAdmin'
import CouponsAdmin from '../components/admin/CouponsAdmin'
import ExperiencesAdmin from '../components/admin/ExperiencesAdmin'
import OrdersAdmin from '../components/admin/OrdersAdmin'
import ReviewsAdmin from '../components/admin/ReviewsAdmin'
import SessionsAdmin from '../components/admin/SessionsAdmin'
import UsersAdmin from '../components/admin/UsersAdmin'
import Tabs from '../components/ui/Tabs'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useStore } from '../hooks/useStore'
import NotFoundPage from './NotFoundPage'
import './AdminPage.css'

const GROUPS = [
  {
    label: 'General',
    sections: [{ id: 'resumen', label: 'Resumen', icon: LayoutGrid, component: AdminOverview, description: 'Cómo viene PLAN y qué conviene revisar.' }],
  },
  {
    label: 'Catálogo',
    sections: [
      {
        id: 'experiencias',
        label: 'Experiencias',
        icon: Store,
        component: ExperiencesAdmin,
        collection: 'experiences',
        description: 'Todas las publicaciones del sitio. Revisá disponibilidad, ventas y dá de baja las que no cumplan las reglas.',
      },
      {
        id: 'sesiones',
        label: 'Sesiones',
        icon: CalendarDays,
        component: SessionsAdmin,
        collection: 'sessions',
        description: 'Todas las fechas publicadas. Podés crear, editar, pausar o quitar sesiones.',
      },
      { id: 'categorias', label: 'Categorías', icon: Tags, component: CategoriesAdmin, collection: 'categories', description: 'Cómo se agrupan las experiencias en el catálogo.' },
    ],
  },
  {
    label: 'Personas',
    sections: [
      { id: 'usuarios', label: 'Usuarios', icon: Users, component: UsersAdmin, collection: 'users', description: 'Cuentas, permisos de administrador y cuentas desactivadas.' },
    ],
  },
  {
    label: 'Ventas',
    sections: [
      { id: 'ordenes', label: 'Órdenes', icon: Receipt, component: OrdersAdmin, collection: 'orders', description: 'Cada compra, con su cupón y sus reembolsos.' },
      { id: 'reservas', label: 'Reservas', icon: CalendarCheck, component: BookingsAdmin, collection: 'bookings', description: 'Los lugares reservados en cada fecha. Desde acá podés reembolsar.' },
      { id: 'cupones', label: 'Cupones', icon: TicketPercent, component: CouponsAdmin, collection: 'coupons', description: 'Promociones con vigencia y, si querés, un límite de usos.' },
    ],
  },
  {
    label: 'Moderación',
    sections: [
      { id: 'resenas', label: 'Reseñas', icon: MessageSquare, component: ReviewsAdmin, collection: 'reviews', description: 'Lo que opina la gente. Las de puntuación baja se marcan para revisar.' },
    ],
  },
]

const SECTIONS = GROUPS.flatMap((group) => group.sections)

/** Panel de administración: secciones agrupadas en una barra lateral. */
function AdminPage() {
  const { section = 'resumen' } = useParams()
  const { db } = useStore()
  const current = SECTIONS.find((item) => item.id === section)
  useDocumentTitle(current ? `${current.label} · Administración` : 'Administración')

  if (!current) return <NotFoundPage />

  const Section = current.component
  const toTab = ({ id, label, icon, collection }) => ({
    id,
    label,
    icon,
    count: collection ? db[collection].length : undefined,
    to: id === 'resumen' ? '/admin' : `/admin/${id}`,
  })

  return (
    <div className="container page admin-page">
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <p className="admin-sidebar__title">Panel de administración</p>
          {GROUPS.map((group) => (
            <div key={group.label} className="admin-sidebar__group">
              <p className="admin-sidebar__label">{group.label}</p>
              <Tabs items={group.sections.map(toTab)} orientation="vertical" label={group.label} />
            </div>
          ))}
        </aside>

        <div className="admin-layout__content">
          <header className="admin-section-header">
            <span className="eyebrow">Administración</span>
            <h1>{current.label}</h1>
            <p className="muted">{current.description}</p>
          </header>
          {/* key: al cambiar de sección se reinician búsqueda y filtros */}
          <Section key={current.id} />
        </div>
      </div>
    </div>
  )
}

export default AdminPage

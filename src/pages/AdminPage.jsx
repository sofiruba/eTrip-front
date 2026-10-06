import { CalendarCheck, LayoutGrid, MessageSquare, Receipt, Tags, TicketPercent, Users } from 'lucide-react'
import { useParams } from 'react-router-dom'
import AdminOverview from '../components/admin/AdminOverview'
import BookingsAdmin from '../components/admin/BookingsAdmin'
import CategoriesAdmin from '../components/admin/CategoriesAdmin'
import CouponsAdmin from '../components/admin/CouponsAdmin'
import OrdersAdmin from '../components/admin/OrdersAdmin'
import ReviewsAdmin from '../components/admin/ReviewsAdmin'
import UsersAdmin from '../components/admin/UsersAdmin'
import PageHeader from '../components/ui/PageHeader'
import Tabs from '../components/ui/Tabs'
import { useStore } from '../hooks/useStore'
import NotFoundPage from './NotFoundPage'
import './AdminPage.css'

const SECTIONS = [
  { id: 'resumen', label: 'Resumen', icon: LayoutGrid, component: AdminOverview },
  { id: 'usuarios', label: 'Usuarios', icon: Users, component: UsersAdmin, collection: 'users' },
  { id: 'categorias', label: 'Categorías', icon: Tags, component: CategoriesAdmin, collection: 'categories' },
  { id: 'cupones', label: 'Cupones', icon: TicketPercent, component: CouponsAdmin, collection: 'coupons' },
  { id: 'ordenes', label: 'Órdenes', icon: Receipt, component: OrdersAdmin, collection: 'orders' },
  { id: 'reservas', label: 'Reservas', icon: CalendarCheck, component: BookingsAdmin, collection: 'bookings' },
  { id: 'resenas', label: 'Reseñas', icon: MessageSquare, component: ReviewsAdmin, collection: 'reviews' },
]

/** Panel de administración: reemplaza a las 9 pantallas sueltas que había antes. */
function AdminPage() {
  const { section = 'resumen' } = useParams()
  const { db } = useStore()
  const current = SECTIONS.find((item) => item.id === section)

  if (!current) return <NotFoundPage />

  const Section = current.component
  const tabs = SECTIONS.map(({ id, label, icon, collection }) => ({
    id,
    label,
    icon,
    count: collection ? db[collection].length : undefined,
    to: id === 'resumen' ? '/admin' : `/admin/${id}`,
  }))

  return (
    <div className="container page">
      <PageHeader eyebrow="Administración" title="Panel de" accent="control." description="Gestioná la actividad global de PLAN." />
      <div className="admin-layout">
        <Tabs items={tabs} orientation="vertical" label="Secciones del panel" />
        <div className="admin-layout__content">
          <Section />
        </div>
      </div>
    </div>
  )
}

export default AdminPage

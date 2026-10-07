import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search, X } from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { getAvailableDates, getDestinations } from '../../data/selectors'
import { useStore } from '../../hooks/useStore'
import { applyFilters, readFilters } from '../../utils/catalogFilters'
import { formatShortDate } from '../../utils/format'
import { describeGuests } from '../../utils/guests'
import HeroSearch from './HeroSearch'
import './NavbarSearch.css'

const shortDate = (value) => formatShortDate(`${value}T12:00:00`)

function describeDates({ dateFrom, dateTo }) {
  if (!dateFrom) return dateTo ? `Hasta ${shortDate(dateTo)}` : ''
  if (!dateTo) return `Desde ${shortDate(dateFrom)}`
  return dateFrom === dateTo ? shortDate(dateFrom) : `${shortDate(dateFrom)} – ${shortDate(dateTo)}`
}

/**
 * Buscador compacto del navbar: un botón "Buscar" (con un punto si hay una búsqueda activa) que, al tocarlo,
 * despliega el buscador completo (el mismo de la home) en una franja debajo del navbar,
 * como Airbnb. Los desplegables flotan sobre la página. Busca siempre en la home.
 */
function NavbarSearch({ hidden = false }) {
  const { db, experiences } = useStore()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [openedAt, setOpenedAt] = useState(pathname)

  // Cerrar al navegar (por ejemplo, al elegir una experiencia sugerida)
  if (open && openedAt !== pathname) setOpen(false)

  useEffect(() => {
    if (!open) return undefined
    const close = (event) => event.key === 'Escape' && !document.querySelector('.hero-search__popover') && setOpen(false)
    document.addEventListener('keydown', close)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', close)
      document.body.style.overflow = ''
    }
  }, [open])

  const onHome = pathname === '/'
  const filters = readFilters(onHome ? params : new URLSearchParams())

  const search = (patch) => {
    const next = applyFilters(new URLSearchParams(onHome ? params : undefined), patch)
    setOpen(false)
    navigate({ pathname: '/', search: next.toString() })
    window.setTimeout(() => document.getElementById('experiencias')?.scrollIntoView({ behavior: 'smooth' }), 80)
  }

  // Resumen de la búsqueda activa (para el tooltip y los lectores de pantalla)
  const summary = [filters.location, describeDates(filters), describeGuests(filters)].filter(Boolean).join(' · ')

  return (
    <>
      <button
        type="button"
        className={`navbar-search ${hidden || open ? 'is-hidden' : ''}`}
        aria-label={summary ? `Buscar experiencias (búsqueda actual: ${summary})` : 'Buscar experiencias'}
        title={summary || undefined}
        aria-expanded={open}
        aria-hidden={hidden}
        tabIndex={hidden ? -1 : 0}
        onClick={() => {
          setOpen(true)
          setOpenedAt(pathname)
        }}
      >
        <span className="navbar-search__icon">
          <Search size={16} aria-hidden />
          {summary && <i className="navbar-search__dot" aria-hidden />}
        </span>
        <span className="navbar-search__label">Buscar</span>
      </button>

      {open &&
        createPortal(
          <div className="navbar-search-panel" role="dialog" aria-modal="true" aria-label="Buscar experiencias">
            <button type="button" className="navbar-search-panel__backdrop" aria-label="Cerrar búsqueda" onClick={() => setOpen(false)} />
            <div className="navbar-search-panel__sheet">
              <div className="container navbar-search-panel__inner">
                <button type="button" className="navbar-search-panel__close" aria-label="Cerrar búsqueda" onClick={() => setOpen(false)}>
                  <X size={20} aria-hidden />
                </button>
                <HeroSearch
                  value={filters}
                  destinations={getDestinations(experiences)}
                  availableDates={getAvailableDates(db.sessions)}
                  experiences={experiences}
                  autoFocus
                  onSearch={search}
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

export default NavbarSearch

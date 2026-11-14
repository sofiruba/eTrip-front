import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search, X } from 'lucide-react'
import { useSelector } from 'react-redux'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { getAvailableDates, getDestinations } from '../../utils/experiences'
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
 * Buscador compacto del navbar: una barra con lugar, fechas y personas (o "Buscar" / la lupa si no hay lugar) que, al tocarla,
 * despliega el buscador completo (el mismo de la home) en una franja debajo del navbar,
 * como Airbnb. Los desplegables flotan sobre la página. Busca siempre en la home.
 */
function NavbarSearch({ hidden = false }) {
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [openedAt, setOpenedAt] = useState(pathname)

  // Cerrar al navegar (por ejemplo, al elegir una experiencia sugerida)
  if (open && openedAt !== pathname) setOpen(false)

  // Mientras está abierto: Escape lo cierra y se bloquea el scroll del <body> (que está fuera del árbol de React)
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
    // La sección de resultados es del Home (otra rama del árbol): se la busca por id después de navegar
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
        {/* Se ven 1, 2 o los 3 campos según el lugar libre; si no entra ninguno, "Buscar" o solo la lupa (ver NavbarSearch.css) */}
        <span className="navbar-search__fields" aria-hidden>
          <span className="navbar-search__field">{filters.location || 'Cualquier lugar'}</span>
          <span className="navbar-search__field">{describeDates(filters) || 'Cualquier fecha'}</span>
          <span className="navbar-search__field navbar-search__field--guests">{describeGuests(filters) || '¿Cuántos?'}</span>
        </span>
        <span className="navbar-search__label">Buscar</span>
        <span className="navbar-search__icon">
          <Search size={16} aria-hidden />
          {summary && <i className="navbar-search__dot" aria-hidden />}
        </span>
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
                <SearchPanel filters={filters} onSearch={search} />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

/** Se monta recién al abrir el buscador. Las sugerencias salen del catálogo que ya está en el store de Redux. */
function SearchPanel({ filters, onSearch }) {
  const experiences = useSelector((state) => state.experiences.items)
  const sessions = useSelector((state) => state.sessions.items)
  return (
    <HeroSearch
      value={filters}
      destinations={getDestinations(experiences)}
      availableDates={getAvailableDates(sessions)}
      experiences={experiences}
      autoFocus
      onSearch={onSearch}
    />
  )
}

export default NavbarSearch

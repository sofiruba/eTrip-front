import { useState } from 'react'
import { Search } from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import './SearchBar.css'

/**
 * En el inicio filtra en vivo (?q=). En otras páginas busca al apretar Enter,
 * así no te saca de donde estás con cada tecla.
 */
function SearchBar({ onSearch }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const onHome = pathname === '/'
  const urlQuery = onHome ? (params.get('q') ?? '') : ''

  // Mientras se tipea manda el estado local (react-router actualiza la URL con un leve retraso).
  // Si la URL cambia desde afuera (ej. "Limpiar filtros" o volver atrás), el input se resincroniza.
  const [value, setValue] = useState(urlQuery)
  const [focused, setFocused] = useState(false)
  const [syncedQuery, setSyncedQuery] = useState(urlQuery)
  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery)
    if (!focused) setValue(urlQuery)
  }

  const handleChange = (event) => {
    const text = event.target.value
    setValue(text)
    if (!onHome) return
    setParams(
      (current) => {
        if (text) current.set('q', text)
        else current.delete('q')
        return current
      },
      { replace: true, preventScrollReset: true },
    )
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!onHome) navigate(value ? `/?q=${encodeURIComponent(value)}` : '/')
    document.getElementById('experiencias')?.scrollIntoView({ behavior: 'smooth' })
    onSearch?.()
  }

  return (
    <form className="search-bar" role="search" onSubmit={handleSubmit}>
      <Search size={18} aria-hidden />
      <input
        type="search"
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Buscar experiencias, lugares o anfitriones"
        aria-label="Buscar experiencias"
      />
    </form>
  )
}

export default SearchBar

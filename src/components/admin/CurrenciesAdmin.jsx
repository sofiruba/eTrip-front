import { useEffect, useState } from 'react'
import { Pencil } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCurrencies, updateCurrencyRate } from '../../redux/currenciesSlice'
import { isMissing } from '../../redux/helpers'
import { showToast } from '../../redux/toastsSlice'
import { formatFullDate, formatMoney } from '../../utils/format'
import Button from '../ui/Button'
import DataTable from '../ui/DataTable'
import ErrorState from '../ui/ErrorState'
import FormField from '../ui/FormField'
import IconButton from '../ui/IconButton'
import Modal from '../ui/Modal'

/** Cotizaciones de referencia para ver los precios en otra moneda (todo se cobra en pesos). */
function CurrenciesAdmin() {
  const dispatch = useDispatch()
  const currenciesState = useSelector((state) => state.currencies)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    if (isMissing(currenciesState)) dispatch(fetchCurrencies())
  }, [currenciesState, dispatch])

  if (currenciesState.error) return <ErrorState message={currenciesState.error} onRetry={() => dispatch(fetchCurrencies())} />

  return (
    <>
      <DataTable
        rows={currenciesState.items}
        columns={[
          { key: 'name', header: 'Moneda', sortValue: (currency) => currency.name, render: (currency) => <strong>{currency.name}</strong> },
          { key: 'code', header: 'Código', render: (currency) => `${currency.code} · ${currency.symbol}` },
          {
            key: 'rate',
            header: 'Vale (en pesos)',
            sortValue: (currency) => currency.arsPerUnit,
            render: (currency) => formatMoney(currency.arsPerUnit),
          },
          { key: 'updated', header: 'Actualizada', render: (currency) => formatFullDate(currency.updatedAt) },
          {
            key: 'actions',
            header: '',
            align: 'right',
            // Los pesos son la moneda de PLAN: siempre valen 1
            render: (currency) =>
              currency.code !== 'ARS' && <IconButton icon={Pencil} label="Cambiar cotización" variant="ghost" onClick={() => setEditing(currency)} />,
          },
        ]}
      />
      {editing && <RateModal currency={editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function RateModal({ currency, onClose }) {
  const dispatch = useDispatch()
  const [rate, setRate] = useState(String(currency.arsPerUnit))
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    setSending(true)
    return dispatch(updateCurrencyRate({ code: currency.code, arsPerUnit: Number(rate) })).then((action) => {
      if (action.error) {
        setError(action.error.message)
        setSending(false)
        return
      }
      dispatch(showToast({ message: `Cotización del ${currency.name.toLowerCase()} actualizada` }))
      onClose()
    })
  }

  return (
    <Modal
      title={`Cotización: ${currency.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="rate-form" disabled={sending}>
            {sending ? 'Guardando…' : 'Guardar'}
          </Button>
        </>
      }
    >
      <form id="rate-form" className="stack" onSubmit={handleSubmit}>
        <FormField
          label={`¿Cuántos pesos vale 1 ${currency.code}?`}
          type="number"
          step="0.01"
          min="0"
          value={rate}
          error={error}
          onChange={(event) => {
            setRate(event.target.value)
            setError('')
          }}
          autoFocus
        />
      </form>
    </Modal>
  )
}

export default CurrenciesAdmin

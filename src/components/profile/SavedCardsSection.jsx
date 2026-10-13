import { CreditCard, Trash2 } from 'lucide-react'
import { cardExpiry, cardLabel, isCardExpired } from '../../utils/cards'
import CardBrandIcon from '../checkout/CardBrandIcon'
import Button from '../ui/Button'
import SectionHeader from '../ui/SectionHeader'
import './SavedCardsSection.css'

/** Tarjetas guardadas del usuario. Al tocar "Eliminar" avisa cuál (onDelete). */
function SavedCardsSection({ cards, onDelete }) {
  return (
    <section className="section card">
      <SectionHeader eyebrow="Pagos" title="Medios de pago guardados" />
      {cards.length ? (
        <ul className="saved-cards">
          {cards.map((card) => (
            <li key={card.id}>
              <CardBrandIcon brand={card.brand} />
              <span className="saved-cards__text">
                <strong>{cardLabel(card)}</strong>
                <small className={isCardExpired(card) ? 'saved-cards__expired' : 'muted'}>
                  {isCardExpired(card) ? 'Vencida' : `Vence ${cardExpiry(card)}`} · {card.holder}
                </small>
              </span>
              <Button size="sm" variant="ghost" icon={Trash2} onClick={() => onDelete(card)}>
                Eliminar
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted row">
          <CreditCard size={18} aria-hidden />
          Todavía no guardaste tarjetas. Podés hacerlo al pagar tu próxima reserva.
        </p>
      )}
    </section>
  )
}

export default SavedCardsSection

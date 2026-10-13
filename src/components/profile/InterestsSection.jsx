import Button from '../ui/Button'
import SectionHeader from '../ui/SectionHeader'
import InterestList from './InterestList'
import InterestPicker from './InterestPicker'

/**
 * Intereses del perfil. `draft` es la lista mientras se edita (null = no se está editando);
 * el padre la maneja para poder abrir la edición desde "Completá tu perfil".
 */
function InterestsSection({ interests, draft, onDraftChange, onSave }) {
  return (
    <section className="section card">
      <SectionHeader
        eyebrow="Para conocerte mejor"
        title="Mis intereses"
        description="Los usamos para recomendarte planes. También se ven en tu perfil público."
      >
        {!draft && (
          <Button size="sm" variant="secondary" onClick={() => onDraftChange(interests)}>
            Editar intereses
          </Button>
        )}
      </SectionHeader>

      {draft ? (
        <div className="stack">
          <InterestPicker value={draft} onChange={onDraftChange} />
          <div className="row">
            <Button size="sm" onClick={onSave} disabled={!draft.length}>
              Guardar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDraftChange(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : interests.length ? (
        <InterestList interests={interests} />
      ) : (
        <p className="muted">Todavía no elegiste intereses.</p>
      )}
    </section>
  )
}

export default InterestsSection

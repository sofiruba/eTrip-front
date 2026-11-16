import Button from '../ui/Button'
import SectionHeader from '../ui/SectionHeader'
import InterestList from './InterestList'
import InterestPicker from './InterestPicker'

/**
 * Intereses del perfil. `draft` es la lista mientras se edita (null = no se está editando);
 * el padre la maneja para poder abrir la edición desde "Completá tu perfil" y la guarda en el back.
 */
function InterestsSection({ interests, draft, saving = false, onDraftChange, onSave }) {
  return (
    <section className="section card">
      <SectionHeader
        eyebrow="Para conocerte mejor"
        title="Mis intereses"
        description="Con ellos armamos la sección “Para vos” del inicio. También se ven en tu perfil público."
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
            <Button size="sm" onClick={onSave} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDraftChange(null)} disabled={saving}>
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

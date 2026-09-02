import { useEffect } from 'react'
import { useTimelineAnimal, type EventoTimeline, type TipoEventoTimeline } from './useTimelineAnimal'
import type { Animal } from './animais.types'

interface AbaHistoricoProps {
  animalId: string
  animal: Animal | undefined
  refreshKey: number
}

const LABEL_EVENTO: Record<TipoEventoTimeline, string> = {
  vacina: 'Vacina',
  procedimento: 'Procedimento',
  medicamento: 'Medicamento',
  entrada: 'Entrada',
}

// `.timeline-item.{classe}` só define cor de bullet para vacina/exame/
// cirurgia/medicamento/entrada (components.css) — não existe uma classe
// própria para "procedimento" porque a ficha não separa mais Cirurgias de
// Procedimentos (ver "Contexto" do plano de T22), então reaproveita a cor
// de "cirurgia" para esse tipo.
function classeCss(tipo: TipoEventoTimeline): string {
  return tipo === 'procedimento' ? 'cirurgia' : tipo
}

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

function ItemTimeline({ evento }: { evento: EventoTimeline }) {
  return (
    <div className={`timeline-item ${classeCss(evento.tipo)}`}>
      <div className="bullet" />
      <div className="meta">
        {formatarData(evento.data)} · <strong style={{ color: 'var(--color-text-primary)' }}>{LABEL_EVENTO[evento.tipo]}</strong>
      </div>
      <div className="ev-title">
        {evento.titulo}
        {evento.retificado && (
          <span className="badge badge-neutral" style={{ marginLeft: 6 }}>
            Retificado
          </span>
        )}
      </div>
      <div className="ev-body">
        {evento.corpo && (
          <>
            {evento.corpo}
            <br />
          </>
        )}
        <span style={{ color: 'var(--color-text-muted)' }}>Por {evento.por}</span>
        {evento.aviso && <div className="ev-warn">⚠ {evento.aviso}</div>}
      </div>
    </div>
  )
}

export function AbaHistorico({ animalId, animal, refreshKey }: AbaHistoricoProps) {
  const { eventos, carregando, fimDoHistorico, erro, carregarMais } = useTimelineAnimal(animalId, animal, refreshKey)

  useEffect(() => {
    if (eventos.length === 0 && !carregando && !fimDoHistorico && !erro) {
      carregarMais(20)
    }
    // Dispara ao montar e sempre que o hook reinicia (eventos volta a [])
    // após um novo registro criado em qualquer aba — ver useTimelineAnimal.
    // carregarMais só muda de identidade quando animalId muda (useCallback),
    // então incluí-la aqui não gera execuções extras do efeito.
  }, [eventos.length, carregando, fimDoHistorico, erro, carregarMais])

  if (erro) {
    return (
      <div className="alert danger" role="alert">
        <span className="bullet" />
        <div className="alert-content">Não foi possível carregar o histórico.</div>
      </div>
    )
  }

  if (eventos.length === 0 && carregando) {
    return <span className="skel" style={{ display: 'inline-block', width: '60%', height: 14 }} />
  }

  if (eventos.length === 0) {
    return (
      <div className="empty">
        <h3>Nenhum evento registrado</h3>
        <p>O histórico deste animal aparecerá aqui conforme vacinas, procedimentos e medicamentos forem registrados.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="timeline">
        {eventos.map((evento) => (
          <ItemTimeline key={`${evento.tipo}-${evento.id}`} evento={evento} />
        ))}
      </div>
      <div className="flex" style={{ justifyContent: 'center', marginTop: 'var(--space-4)' }}>
        {fimDoHistorico ? (
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Fim do histórico</span>
        ) : (
          <button type="button" className="btn btn-outline btn-sm" disabled={carregando} onClick={() => carregarMais(20)}>
            {carregando ? 'Carregando…' : 'Carregar mais 20 eventos'}
          </button>
        )}
      </div>
    </div>
  )
}

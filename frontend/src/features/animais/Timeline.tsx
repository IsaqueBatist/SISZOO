import { Icon, type IconName } from '../../components/layout/Icon'
import type { EventoTimeline, TipoEventoTimeline } from './useTimelineAnimal'

interface TimelineProps {
  eventos: EventoTimeline[]
  carregando: boolean
  fimDoHistorico: boolean
  erro: boolean
  onCarregarMais: () => void
}

const LABEL_EVENTO: Record<TipoEventoTimeline, string> = {
  vacina: 'Vacina',
  procedimento: 'Procedimento',
  medicamento: 'Medicamento',
  entrada: 'Entrada',
}

// Não existe ícone de "admissão/entrada" no design system — `home` é o mais
// próximo semanticamente (chegada ao CCZ) e já está portado em Icon.tsx.
const ICONE_EVENTO: Record<TipoEventoTimeline, IconName> = {
  vacina: 'syringe',
  procedimento: 'scissors',
  medicamento: 'pill',
  entrada: 'home',
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

// Segurança explícita na borda de apresentação: o hook já entrega `eventos`
// ordenado por data desc (merge k-way), mas a ordenação aqui garante o
// contrato de `<Timeline>` mesmo se a prop vier de outra fonte no futuro.
// Comparação lexicográfica é segura porque `EventoTimeline.data` é sempre
// 'YYYY-MM-DD' (ver `useTimelineAnimal.ts`, funções `*ParaEvento`).
function ordenarPorDataDesc(eventos: EventoTimeline[]): EventoTimeline[] {
  return [...eventos].sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0))
}

function ItemTimeline({ evento }: { evento: EventoTimeline }) {
  return (
    <div className={`timeline-item ${classeCss(evento.tipo)}`}>
      <div className="bullet">
        <Icon name={ICONE_EVENTO[evento.tipo]} size={12} />
      </div>
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

export function Timeline({ eventos, carregando, fimDoHistorico, erro, onCarregarMais }: TimelineProps) {
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

  const eventosOrdenados = ordenarPorDataDesc(eventos)

  return (
    <div>
      <div className="timeline">
        {eventosOrdenados.map((evento) => (
          <ItemTimeline key={`${evento.tipo}-${evento.id}`} evento={evento} />
        ))}
      </div>
      <div className="flex" style={{ justifyContent: 'center', marginTop: 'var(--space-4)' }}>
        {fimDoHistorico ? (
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Fim do histórico</span>
        ) : (
          <button type="button" className="btn btn-outline btn-sm" disabled={carregando} onClick={onCarregarMais}>
            {carregando ? 'Carregando…' : 'Carregar mais 20 eventos'}
          </button>
        )}
      </div>
    </div>
  )
}

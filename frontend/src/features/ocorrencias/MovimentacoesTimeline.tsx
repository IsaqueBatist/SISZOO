import { Icon, type IconName } from '../../components/layout/Icon'
import type { MovimentacaoOcorrencia, TipoMovimentacao } from './ocorrencias.types'

interface MovimentacoesTimelineProps {
  movimentacoes: MovimentacaoOcorrencia[]
}

const LABEL_MOVIMENTACAO: Record<TipoMovimentacao, string> = {
  registrada: 'Ocorrência registrada',
  equipe_despachada: 'Equipe despachada',
  processo_vinculado: 'Processo vinculado',
  aguardando_resultado: 'Aguardando resultado',
  encerrada: 'Ocorrência encerrada',
  nota_interna: 'Nota interna',
}

const ICONE_MOVIMENTACAO: Record<TipoMovimentacao, IconName> = {
  registrada: 'clipboard',
  equipe_despachada: 'users',
  processo_vinculado: 'plus',
  aguardando_resultado: 'eye',
  encerrada: 'check',
  nota_interna: 'edit',
}

// `.timeline-item.{classe}` (components.css) só define cor de bullet para
// vacina/exame/cirurgia/medicamento/entrada — não existe classe própria para
// os 6 tipos de movimentação de ocorrência. Reaproveita as cores existentes
// por proximidade semântica (mesmo tipo de decisão documentada em
// animais/Timeline.tsx para "procedimento" → "cirurgia").
const CLASSE_CSS: Record<TipoMovimentacao, string> = {
  registrada: 'entrada',
  equipe_despachada: 'exame',
  processo_vinculado: 'cirurgia',
  aguardando_resultado: 'medicamento',
  encerrada: 'vacina',
  nota_interna: 'entrada',
}

const FUSO_ITU = 'America/Sao_Paulo'

// Formata data e hora separadamente e junta com "·" (em vez de usar as
// opções `day`+`hour` juntas num único Intl.DateTimeFormat, que produz
// "10/05/2026, 08:00" com vírgula) para reproduzir o separador do protótipo
// docs/prototipo/ocorrencia.html ("20/05/2026 · 14:32") sem depender da
// pontuação exata que a formatação pt-BR do Intl decide usar.
function formatarDataHora(iso: string): string {
  const data = new Date(iso)
  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: FUSO_ITU,
  }).format(data)
  const horaFormatada = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: FUSO_ITU }).format(data)
  return `${dataFormatada} · ${horaFormatada}`
}

// Ordena por data desc (mais recente primeiro) — mesma convenção de
// animais/Timeline.tsx e do protótipo docs/prototipo/ocorrencia.html.
function ordenarPorDataDesc(movimentacoes: MovimentacaoOcorrencia[]): MovimentacaoOcorrencia[] {
  return [...movimentacoes].sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0))
}

function ItemTimeline({ movimentacao }: { movimentacao: MovimentacaoOcorrencia }) {
  return (
    <div className={`timeline-item ${CLASSE_CSS[movimentacao.tipoMovimentacao]}`}>
      <div className="bullet">
        <Icon name={ICONE_MOVIMENTACAO[movimentacao.tipoMovimentacao]} size={12} />
      </div>
      <div className="meta">{formatarDataHora(movimentacao.data)}</div>
      <div className="ev-title">{LABEL_MOVIMENTACAO[movimentacao.tipoMovimentacao]}</div>
      <div className="ev-body">
        {movimentacao.descricao && (
          <>
            {movimentacao.descricao}
            <br />
          </>
        )}
        <span style={{ color: 'var(--color-text-muted)' }}>Por {movimentacao.usuarioNome}</span>
      </div>
    </div>
  )
}

export function MovimentacoesTimeline({ movimentacoes }: MovimentacoesTimelineProps) {
  if (movimentacoes.length === 0) {
    return (
      <div className="empty">
        <h3>Nenhuma movimentação registrada</h3>
        <p>O histórico desta ocorrência aparecerá aqui conforme novos eventos forem registrados.</p>
      </div>
    )
  }

  const movimentacoesOrdenadas = ordenarPorDataDesc(movimentacoes)

  return (
    <div className="timeline">
      {movimentacoesOrdenadas.map((movimentacao) => (
        <ItemTimeline key={movimentacao.id} movimentacao={movimentacao} />
      ))}
    </div>
  )
}

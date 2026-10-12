import { Icon, type IconName } from '@/components/layout/Icon'
import type { MovimentacaoOcorrencia, TipoMovimentacao } from '../types/ocorrencias.types'
import { formatarDataHora } from '../utils/datas'
import { badgeDeStatus } from '../utils/statusBadge'

interface MovimentacoesTimelineProps {
  movimentacoes: MovimentacaoOcorrencia[]
}

const LABEL_MOVIMENTACAO: Record<TipoMovimentacao, string> = {
  REGISTRADA: 'Ocorrência registrada',
  EQUIPE_DESPACHADA: 'Equipe despachada',
  PROCESSO_VINCULADO: 'Processo vinculado',
  AGUARDANDO_RESULTADO: 'Aguardando resultado',
  ENCERRADA: 'Ocorrência encerrada',
  NOTA_INTERNA: 'Nota interna',
}

const ICONE_MOVIMENTACAO: Record<TipoMovimentacao, IconName> = {
  REGISTRADA: 'clipboard',
  EQUIPE_DESPACHADA: 'users',
  PROCESSO_VINCULADO: 'plus',
  AGUARDANDO_RESULTADO: 'eye',
  ENCERRADA: 'check',
  NOTA_INTERNA: 'edit',
}

// `.timeline-item.{classe}` (components.css) só define cor de bullet para
// vacina/exame/cirurgia/medicamento/entrada — não existe classe própria para
// os 6 tipos de movimentação de ocorrência. Reaproveita as cores existentes
// por proximidade semântica (mesmo tipo de decisão documentada em
// animais/Timeline.tsx para "procedimento" → "cirurgia").
const CLASSE_CSS: Record<TipoMovimentacao, string> = {
  REGISTRADA: 'entrada',
  EQUIPE_DESPACHADA: 'exame',
  PROCESSO_VINCULADO: 'cirurgia',
  AGUARDANDO_RESULTADO: 'medicamento',
  ENCERRADA: 'vacina',
  NOTA_INTERNA: 'entrada',
}

// Ordena por data desc (mais recente primeiro) — mesma convenção de
// animais/Timeline.tsx e do protótipo docs/prototipo/ocorrencia.html. As datas
// são LocalDateTime sem fuso no mesmo formato, então a ordem da string é a
// ordem cronológica.
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
        {movimentacao.statusAnterior && movimentacao.statusNovo && (
          <>
            {badgeDeStatus(movimentacao.statusAnterior).label} → {badgeDeStatus(movimentacao.statusNovo).label}
            <br />
          </>
        )}
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

import type { IconName } from '@/components/layout/Icon'
import type { AcaoAuditoria } from '../types/auditoria.types'

export type TomAcao = 'info' | 'success' | 'warning' | 'danger'

export interface DescricaoAcao {
  verbo: string
  icone: IconName
  tom: TomAcao
}

// Ícone + cor + verbo em português — para quem olha a tela entender a ação
// sem precisar saber o nome do enum. VISUALIZACAO e ACESSO_NEGADO em tom
// "danger": são as ações ligadas a dado sensível (acesso, autorizado ou
// recusado, a denunciante de ocorrência sigilosa, T26/T43/LGPD) — valem se
// destacar mais que as demais.
const DESCRICOES: Record<AcaoAuditoria, DescricaoAcao> = {
  CRIACAO: { verbo: 'criou', icone: 'plus', tom: 'success' },
  ATUALIZACAO: { verbo: 'atualizou', icone: 'edit', tom: 'info' },
  DESATIVACAO: { verbo: 'desativou', icone: 'x', tom: 'warning' },
  REATIVACAO: { verbo: 'reativou', icone: 'check', tom: 'success' },
  LOGIN: { verbo: 'entrou no sistema', icone: 'user', tom: 'info' },
  LOGOUT: { verbo: 'saiu do sistema', icone: 'logout', tom: 'info' },
  EXPORTACAO: { verbo: 'exportou dados', icone: 'chart', tom: 'info' },
  ENCERRAMENTO: { verbo: 'encerrou', icone: 'check', tom: 'warning' },
  VISUALIZACAO: { verbo: 'visualizou', icone: 'eye', tom: 'danger' },
  ACESSO_NEGADO: { verbo: 'teve acesso negado a', icone: 'lock', tom: 'danger' },
}

export function descricaoAcao(acao: AcaoAuditoria): DescricaoAcao {
  return DESCRICOES[acao]
}

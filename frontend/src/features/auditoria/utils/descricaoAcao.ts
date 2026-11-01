import type { IconName } from '@/components/layout/Icon'
import type { AcaoAuditoria } from '../types/auditoria.types'

export type TomAcao = 'info' | 'success' | 'warning' | 'danger'

export interface DescricaoAcao {
  verbo: string
  rotulo: string
  icone: IconName
  tom: TomAcao
}

// Ícone + cor + verbo em português - para quem olha a tela entender a ação
// sem precisar saber o nome do enum.
// VISUALIZACAO e ACESSO_NEGADO em tom "danger": são as ações ligadas a dado
// sensível (acesso, autorizado ou recusado, a denunciante de ocorrência
// sigilosa, T26/T43/LGPD) - valem se destacar mais que as demais.
const DESCRICOES: Record<AcaoAuditoria, DescricaoAcao> = {
  CRIACAO: { verbo: 'criou', rotulo: 'Criação', icone: 'plus', tom: 'success' },
  ATUALIZACAO: { verbo: 'atualizou', rotulo: 'Atualização', icone: 'edit', tom: 'info' },
  DESATIVACAO: { verbo: 'desativou', rotulo: 'Desativação', icone: 'x', tom: 'warning' },
  REATIVACAO: { verbo: 'reativou', rotulo: 'Reativação', icone: 'check', tom: 'success' },
  LOGIN: { verbo: 'entrou no sistema', rotulo: 'Entrada no sistema', icone: 'user', tom: 'info' },
  LOGOUT: { verbo: 'saiu do sistema', rotulo: 'Saída do sistema', icone: 'logout', tom: 'info' },
  EXPORTACAO: { verbo: 'exportou dados', rotulo: 'Exportação', icone: 'chart', tom: 'info' },
  ENCERRAMENTO: { verbo: 'encerrou', rotulo: 'Encerramento', icone: 'check', tom: 'warning' },
  VISUALIZACAO: { verbo: 'visualizou', rotulo: 'Visualização de dado sigiloso', icone: 'eye', tom: 'danger' },
  ACESSO_NEGADO: { verbo: 'teve acesso negado a', rotulo: 'Acesso negado', icone: 'lock', tom: 'danger' },
  SESSAO_REVOGADA: { verbo: 'teve revogada', rotulo: 'Sessão revogada', icone: 'lock', tom: 'danger' },
}

export function descricaoAcao(acao: AcaoAuditoria): DescricaoAcao {
  return DESCRICOES[acao]
}

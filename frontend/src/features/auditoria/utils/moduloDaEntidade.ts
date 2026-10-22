// Espelha com.siszoo.usuarios.entity.Modulo. O evento de auditoria
// (AuditoriaEvento) não tem coluna "modulo" — só "entidade" (string livre) —
// então o mapeamento entidade → módulo é feito aqui, no frontend, a partir
// das strings literais usadas nas chamadas de AuditoriaEventoService.registrar
// em cada módulo do backend.
export type Modulo = 'USUARIOS_ACESSO' | 'GESTAO_ANIMAIS' | 'OCORRENCIAS_DENUNCIAS' | 'PROCESSOS_SANITARIOS' | 'RELATORIOS' | 'OUTRO'

const MODULO_POR_ENTIDADE: Record<string, Modulo> = {
  usuario: 'USUARIOS_ACESSO',
  preferencia_usuario: 'USUARIOS_ACESSO',
  animal: 'GESTAO_ANIMAIS',
  baia: 'GESTAO_ANIMAIS',
  medicamento: 'GESTAO_ANIMAIS',
  vacinacao: 'GESTAO_ANIMAIS',
  procedimento: 'GESTAO_ANIMAIS',
  prescricao: 'GESTAO_ANIMAIS',
  exame: 'GESTAO_ANIMAIS',
  anexo_animal: 'GESTAO_ANIMAIS',
  denunciante: 'OCORRENCIAS_DENUNCIAS',
  relatorio_gerado: 'RELATORIOS',
  ocorrencia: 'OCORRENCIAS_DENUNCIAS',
  anexo_ocorrencia: 'OCORRENCIAS_DENUNCIAS',
  processo_sanitario: 'PROCESSOS_SANITARIOS',
}

const ROTULO_POR_MODULO: Record<Modulo, string> = {
  USUARIOS_ACESSO: 'Usuários e Acesso',
  GESTAO_ANIMAIS: 'Gestão de Animais',
  OCORRENCIAS_DENUNCIAS: 'Ocorrências e Denúncias',
  PROCESSOS_SANITARIOS: 'Processos Sanitários',
  RELATORIOS: 'Relatórios',
  OUTRO: 'Outros',
}

// Fallback 'OUTRO': o backend não garante que toda entidade futura vai estar
// mapeada aqui (não existe esse vínculo formal no banco), então uma entidade
// desconhecida não pode quebrar o agrupamento.
export function moduloDaEntidade(entidade: string): Modulo {
  return MODULO_POR_ENTIDADE[entidade] ?? 'OUTRO'
}

export function labelModulo(modulo: Modulo): string {
  return ROTULO_POR_MODULO[modulo]
}

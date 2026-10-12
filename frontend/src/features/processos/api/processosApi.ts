import type { RoleKey } from '@/lib/nav'
import type { PaginaResponse } from '@/features/usuarios/types/usuarios.types'
import {
  anexarDocumentoMock,
  buscarProcessoMockPorId,
  concluirProcessoMock,
  criarProcessoMock,
  enviarAmostrasMock,
  listarProcessosMock,
  registrarResultadoMock,
  vincularExistentesMock,
} from './processosMockStore'
import { buscarOcorrenciaDemonstracao, listarOcorrenciasDisponiveisDemonstracao } from './ocorrenciasDemonstracao'
import type {
  AnexarDocumentoRequest,
  CriarProcessoRequest,
  EnviarAmostrasRequest,
  OcorrenciaParaVinculo,
  Processo,
  ProcessosFiltro,
  RegistrarResultadoRequest,
} from '../types/processos.types'

// DEMONSTRAÇÃO (D40): as telas de processos seguem sobre o mock em memória
// (processosMockStore.ts), devolvido embrulhado em Promise, SEM gate de
// `import.meta.env.PROD` — o build de produção é o próprio ambiente Docker de
// verificação, e excluir o mock dele quebraria essas telas. O processo mínimo
// real (T25) é criado e avançado pela tela da ocorrência, não por aqui.
// Quando a task de processos chegar, cada função troca o corpo por uma
// chamada `http`, sem mudar a assinatura pública nem os hooks que a
// consomem.

export class ErroNegocioProcesso extends Error {}

// Delay pequeno só para loading/skeleton aparecerem de verdade num teste
// manual — nunca usado pelos testes automatizados, que mockam este módulo
// inteiro via `vi.mock` quando precisam exercitar erro.
function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const DELAY_MS = 250

export async function criarProcesso(payload: CriarProcessoRequest, autorNome: string): Promise<Processo> {
  await esperar(DELAY_MS)
  const resultado = criarProcessoMock(payload, autorNome)
  if (!resultado.ok) {
    if (resultado.motivo === 'ocorrencia_ja_vinculada') {
      throw new ErroNegocioProcesso('Esta ocorrência já tem um processo sanitário vinculado.')
    }
    throw new ErroNegocioProcesso('Ocorrência não encontrada.')
  }
  return resultado.processo
}

export async function listarProcessos(filtro: ProcessosFiltro, roleKey: RoleKey): Promise<PaginaResponse<Processo>> {
  await esperar(DELAY_MS)
  return listarProcessosMock(filtro, roleKey)
}

export async function buscarProcessoPorId(id: string, roleKey: RoleKey): Promise<Processo | null> {
  await esperar(DELAY_MS)
  return buscarProcessoMockPorId(id, roleKey)
}

// Ocorrências fictícias do mock de processos (D40): o wizard e o detalhe de
// processo não leem nem alteram ocorrências reais.
export async function listarOcorrenciasParaVinculo(q: string | undefined, roleKey: RoleKey): Promise<OcorrenciaParaVinculo[]> {
  await esperar(DELAY_MS)
  return listarOcorrenciasDisponiveisDemonstracao(q, roleKey)
}

export async function buscarOcorrenciaParaVinculo(
  id: string,
  roleKey: RoleKey,
): Promise<ReturnType<typeof buscarOcorrenciaDemonstracao>> {
  await esperar(DELAY_MS)
  return buscarOcorrenciaDemonstracao(id, roleKey)
}

export async function enviarAmostras(id: string, payload: EnviarAmostrasRequest): Promise<Processo> {
  await esperar(DELAY_MS)
  const resultado = enviarAmostrasMock(id, payload)
  if (!resultado.ok) throw new ErroNegocioProcesso('Não foi possível enviar as amostras ao laboratório.')
  return resultado.processo
}

export async function registrarResultado(id: string, payload: RegistrarResultadoRequest): Promise<Processo> {
  await esperar(DELAY_MS)
  const resultado = registrarResultadoMock(id, payload)
  if (!resultado.ok) throw new ErroNegocioProcesso('Não foi possível registrar o resultado.')
  return resultado.processo
}

export async function concluirProcesso(id: string): Promise<Processo> {
  await esperar(DELAY_MS)
  const resultado = concluirProcessoMock(id)
  if (!resultado.ok) throw new ErroNegocioProcesso('Não foi possível concluir o processo.')
  return resultado.processo
}

export async function anexarDocumento(id: string, payload: AnexarDocumentoRequest, autorNome: string): Promise<Processo> {
  await esperar(DELAY_MS)
  const resultado = anexarDocumentoMock(id, payload, autorNome)
  if (!resultado.ok) throw new ErroNegocioProcesso('Não foi possível anexar o documento.')
  return resultado.processo
}

export async function vincularExistentes(processoId: string, ocorrenciaId: string): Promise<Processo> {
  await esperar(DELAY_MS)
  const resultado = vincularExistentesMock(processoId, ocorrenciaId)
  if (!resultado.ok) {
    const mensagens: Record<typeof resultado.motivo, string> = {
      processo_nao_encontrado: 'Processo não encontrado.',
      ocorrencia_nao_encontrada: 'Ocorrência não encontrada.',
      processo_ja_vinculado: 'Este processo já tem uma ocorrência vinculada.',
      ocorrencia_ja_vinculada: 'Esta ocorrência já tem um processo sanitário vinculado.',
    }
    throw new ErroNegocioProcesso(mensagens[resultado.motivo])
  }
  return resultado.processo
}

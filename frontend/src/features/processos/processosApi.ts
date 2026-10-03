import type { RoleKey } from '../../lib/nav'
import type { PaginaResponse } from '../usuarios/usuarios.types'
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
import type {
  AnexarDocumentoRequest,
  CriarProcessoRequest,
  EnviarAmostrasRequest,
  Processo,
  ProcessosFiltro,
  RegistrarResultadoRequest,
} from './processos.types'

// PROVISÓRIO: o módulo `processos` ainda não tem backend real (só pastas
// .gitkeep em com.siszoo.processos). Segue literalmente o padrão ATUAL de
// ocorrenciasApi.ts (commit 7fa8cfe): import estático do mock store,
// devolvido embrulhado em Promise, SEM gate de `import.meta.env.PROD`. Esse
// gate já existiu em ocorrências e foi removido de propósito, porque o único
// "build de produção" que existe hoje é o próprio ambiente Docker de
// verificação do projeto — excluir o mock dele quebraria a forma de testar o
// sistema. Quando o backend nascer, cada função troca o corpo por uma
// chamada `http.get/post`, sem mudar a assinatura pública nem os hooks que a
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

import { criarProcessoMock } from './processosMockStore'
import type { CriarProcessoRequest, Processo } from './processos.types'

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

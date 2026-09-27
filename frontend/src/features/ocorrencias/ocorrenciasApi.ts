import type { RoleKey } from '../../lib/nav'
import type { PaginaResponse } from '../usuarios/usuarios.types'
import type { CriarOcorrenciaRequest, EncerrarOcorrenciaRequest, Ocorrencia, OcorrenciasFiltro } from './ocorrencias.types'

// PROVISÓRIO: o módulo `ocorrencias` ainda não tem backend real (T25/T26).
// Em vez de chamar `http` (axios) como as outras features, esta camada
// carrega o store mockado (`ocorrenciasMockStore.ts`) via `import()`
// dinâmico guardado por `import.meta.env.PROD` — mesmo padrão já usado em
// `main.tsx::enableMocking` para o MSW. Isso mantém os dados fake e a
// lógica de mascaramento fora do bundle de produção (o import só é
// alcançável quando `PROD` é `false`, e o Vite descarta o branch morto no
// build). Quando o backend nascer, cada função troca o corpo por uma
// chamada `http.get/post/patch`, sem mudar a assinatura pública nem os
// hooks que a consomem.
async function store() {
  return import('./ocorrenciasMockStore')
}

export class ErroNegocioOcorrencia extends Error {}

// Delay pequeno só para loading/skeleton aparecerem de verdade num teste
// manual (`npm run dev`) — nunca usado pelos testes automatizados, que
// mockam este módulo inteiro via `vi.mock` quando precisam exercitar erro.
function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const DELAY_MS = 250

export async function listarOcorrencias(filtro: OcorrenciasFiltro, roleKey: RoleKey): Promise<PaginaResponse<Ocorrencia>> {
  if (import.meta.env.PROD) {
    throw new Error('Módulo de ocorrências ainda não tem backend real (T25/T26).')
  }
  await esperar(DELAY_MS)
  const { listarOcorrenciasMock } = await store()
  return listarOcorrenciasMock(filtro, roleKey)
}

export async function buscarOcorrenciaPorId(id: string, roleKey: RoleKey): Promise<Ocorrencia> {
  if (import.meta.env.PROD) {
    throw new Error('Módulo de ocorrências ainda não tem backend real (T25/T26).')
  }
  await esperar(DELAY_MS)
  const { buscarOcorrenciaMockPorId } = await store()
  const encontrada = buscarOcorrenciaMockPorId(id, roleKey)
  if (!encontrada) throw new Error('Ocorrência não encontrada.')
  return encontrada
}

export async function criarOcorrencia(payload: CriarOcorrenciaRequest, autorNome: string): Promise<Ocorrencia> {
  if (import.meta.env.PROD) {
    throw new Error('Módulo de ocorrências ainda não tem backend real (T25/T26).')
  }
  await esperar(DELAY_MS)
  const { criarOcorrenciaMock } = await store()
  return criarOcorrenciaMock(payload, autorNome)
}

export async function encerrarOcorrencia(
  id: string,
  payload: EncerrarOcorrenciaRequest,
  autorNome: string,
): Promise<Ocorrencia> {
  if (import.meta.env.PROD) {
    throw new Error('Módulo de ocorrências ainda não tem backend real (T25/T26).')
  }
  await esperar(DELAY_MS)
  const { encerrarOcorrenciaMock } = await store()
  const resultado = encerrarOcorrenciaMock(id, payload, autorNome)
  if (!resultado.ok) {
    if (resultado.motivo === 'processo_pendente') {
      throw new ErroNegocioOcorrencia('Não é possível encerrar: há processo sanitário vinculado aguardando resultado.')
    }
    throw new Error('Ocorrência não encontrada.')
  }
  return resultado.ocorrencia
}

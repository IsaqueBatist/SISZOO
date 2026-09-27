import type { RoleKey } from '../../lib/nav'
import type { PaginaResponse } from '../usuarios/usuarios.types'
import {
  buscarOcorrenciaMockPorId,
  criarOcorrenciaMock,
  encerrarOcorrenciaMock,
  listarOcorrenciasMock,
} from './ocorrenciasMockStore'
import type { CriarOcorrenciaRequest, EncerrarOcorrenciaRequest, Ocorrencia, OcorrenciasFiltro } from './ocorrencias.types'

// PROVISÓRIO: o módulo `ocorrencias` ainda não tem backend real (T25/T26).
// Em vez de chamar `http` (axios) como as outras features, esta camada
// devolve o resultado do store mockado (`ocorrenciasMockStore.ts`)
// embrulhado em Promise, para manter a mesma forma assíncrona que
// `useQuery`/`useMutation` esperam. Quando o backend nascer, cada função
// troca o corpo por uma chamada `http.get/post/patch`, sem mudar a
// assinatura pública nem os hooks que a consomem.
//
// Chega a ser tentador excluir esse mock do bundle "de produção" (`vite
// build`) — cheguei a fazer isso via import() dinâmico guardado por
// `import.meta.env.PROD` numa versão anterior. Na prática, o único build de
// produção que existe hoje É o ambiente de verificação do projeto
// (`docker compose up` builda a imagem de frontend com `npm run build` e
// serve via nginx — ver `frontend/Dockerfile`), então excluir o mock desse
// build só quebra a própria forma de testar o sistema. Revisitar quando
// existir uma distinção real entre "build de demonstração" e "produção".

export class ErroNegocioOcorrencia extends Error {}

// Delay pequeno só para loading/skeleton aparecerem de verdade num teste
// manual — nunca usado pelos testes automatizados, que mockam este módulo
// inteiro via `vi.mock` quando precisam exercitar erro.
function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const DELAY_MS = 250

export async function listarOcorrencias(filtro: OcorrenciasFiltro, roleKey: RoleKey): Promise<PaginaResponse<Ocorrencia>> {
  await esperar(DELAY_MS)
  return listarOcorrenciasMock(filtro, roleKey)
}

export async function buscarOcorrenciaPorId(id: string, roleKey: RoleKey): Promise<Ocorrencia> {
  await esperar(DELAY_MS)
  const encontrada = buscarOcorrenciaMockPorId(id, roleKey)
  if (!encontrada) throw new Error('Ocorrência não encontrada.')
  return encontrada
}

export async function criarOcorrencia(payload: CriarOcorrenciaRequest, autorNome: string): Promise<Ocorrencia> {
  await esperar(DELAY_MS)
  return criarOcorrenciaMock(payload, autorNome)
}

export async function encerrarOcorrencia(
  id: string,
  payload: EncerrarOcorrenciaRequest,
  autorNome: string,
): Promise<Ocorrencia> {
  await esperar(DELAY_MS)
  const resultado = encerrarOcorrenciaMock(id, payload, autorNome)
  if (!resultado.ok) {
    if (resultado.motivo === 'processo_pendente') {
      throw new ErroNegocioOcorrencia('Não é possível encerrar: há processo sanitário vinculado aguardando resultado.')
    }
    throw new Error('Ocorrência não encontrada.')
  }
  return resultado.ocorrencia
}

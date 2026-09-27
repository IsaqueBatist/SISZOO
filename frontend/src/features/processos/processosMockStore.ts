import { buscarOcorrenciaMockPorId, vincularProcessoNaOcorrenciaMock } from '../ocorrencias/ocorrenciasMockStore'
import type { CriarProcessoRequest, OcorrenciaParaVinculo, Processo } from './processos.types'

// PROVISÓRIO: mock autoral da feature de processos — o backend real ainda
// não existe (com.siszoo.processos só tem pastas .gitkeep). Store local em
// memória, síncrono, mesmo padrão de ocorrenciasMockStore.ts: sempre devolve
// cópias (structuredClone), nunca a referência viva do array.

let processosMock: Processo[] = []

export function resetProcessosMock() {
  processosMock = []
}

// Sequência anual client-side só para o mock — sem lock de concorrência real
// (o DER exige lock no backend real). Acima de 999 processos no mesmo ano, o
// protocolo deixa de ter 3 dígitos exatos (ex.: "1000/2026") em vez de
// travar; comportamento definido no plano da T32, sem base no DER
// ([EXTRAPOLAÇÃO]) — mesma decisão já tomada em ocorrenciasMockStore.ts.
function gerarProximoProtocolo(processos: Processo[]): string {
  const sufixo = `/${new Date().getFullYear()}`
  const maiorSequencia = processos
    .filter((item) => item.protocolo.endsWith(sufixo))
    .reduce((maior, item) => Math.max(maior, Number(item.protocolo.split('/')[0])), 0)
  return `${String(maiorSequencia + 1).padStart(3, '0')}${sufixo}`
}

function paraResumoVinculo(ocorrenciaId: string): OcorrenciaParaVinculo | null {
  // roleKey 'admin' aqui é interno/técnico: só precisamos do nome do
  // denunciante para o snapshot somente-leitura salvo no processo — o
  // mascaramento por perfil de quem está OLHANDO o processo acontece na
  // hora de exibir (RN3), não na hora de gravar.
  const ocorrencia = buscarOcorrenciaMockPorId(ocorrenciaId, 'admin')
  if (!ocorrencia) return null
  return {
    id: ocorrencia.id,
    protocolo: ocorrencia.protocolo,
    tipoOcorrencia: ocorrencia.tipoOcorrencia,
    bairro: ocorrencia.bairro,
    statusOcorrencia: ocorrencia.statusOcorrencia,
    sigilosa: ocorrencia.sigilosa,
    denunciante: ocorrencia.denunciante ? { nome: ocorrencia.denunciante.nome } : null,
  }
}

export type ResultadoCriacaoProcesso =
  | { ok: true; processo: Processo }
  | { ok: false; motivo: 'ocorrencia_nao_encontrada' | 'ocorrencia_ja_vinculada' }

// Reforça no mock a cardinalidade 0..1 do DER (uma ocorrência só pode ter um
// processo vinculado) — rejeita ANTES de criar qualquer coisa, sem estado
// parcial.
export function criarProcessoMock(payload: CriarProcessoRequest, autorNome: string): ResultadoCriacaoProcesso {
  let ocorrenciaVinculado: OcorrenciaParaVinculo | null = null
  if (payload.ocorrenciaId) {
    const ocorrencia = buscarOcorrenciaMockPorId(payload.ocorrenciaId, 'admin')
    if (!ocorrencia) return { ok: false, motivo: 'ocorrencia_nao_encontrada' }
    if (ocorrencia.processoVinculado) return { ok: false, motivo: 'ocorrencia_ja_vinculada' }
    ocorrenciaVinculado = paraResumoVinculo(payload.ocorrenciaId)
  }

  const agora = new Date().toISOString()
  // RN4 / DER.md:508,585: urgente é derivado — OR de contato humano em
  // qualquer amostra.
  const urgente = payload.amostras.some((amostra) => amostra.contatoHumano)

  const novo: Processo = {
    id: crypto.randomUUID(),
    protocolo: gerarProximoProtocolo(processosMock),
    dataAbertura: payload.dataAbertura,
    doenca: payload.doenca,
    laboratorio: payload.laboratorio,
    ocorrenciaVinculado,
    statusProcesso: 'aberto',
    urgente,
    responsavel: payload.responsavel,
    amostras: payload.amostras,
    observacoes: payload.observacoes,
    criadoPorNome: autorNome,
    criadoEm: agora,
    atualizadoEm: agora,
  }
  processosMock = [...processosMock, novo]

  if (payload.ocorrenciaId) {
    // Reflexo bidirecional exigido pela tarefa: a ocorrência passa a
    // enxergar o processo vinculado (alimenta a regra 13 — bloqueio de
    // encerramento com processo pendente de resultado).
    vincularProcessoNaOcorrenciaMock(payload.ocorrenciaId, {
      id: novo.id,
      protocolo: novo.protocolo,
      statusProcesso: novo.statusProcesso,
      resultadoPendente: true,
    })
  }

  return { ok: true, processo: structuredClone(novo) }
}

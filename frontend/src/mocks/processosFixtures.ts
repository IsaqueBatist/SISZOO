import type { AmostraAnimal, CatalogosProcesso, Processo, ProcessoResumo } from '../features/processos/types/processos.types'
import { OCORRENCIA_PROCESSO_PENDENTE_ID, PROCESSO_PENDENTE_ID } from './ocorrenciasFixtures'

// Fixtures no formato da API de processos (T29) — só para os testes
// automatizados (mocks/server.ts). O processo pendente é o mesmo vinculado à
// ocorrência 092/2026 das fixtures de ocorrência.

export { PROCESSO_PENDENTE_ID }
export const PROCESSO_SEM_VINCULO_ID = 'h7000000-0000-0000-0000-000000000002'
export const PROCESSO_CRIADO_ID = 'h7000000-0000-0000-0000-000000000098'
export const ANIMAL_AMOSTRADO_ID = 'a1000000-0000-0000-0000-000000000001'

export const CATALOGOS_PROCESSO_FIXTURE: CatalogosProcesso = {
  doencas: [
    { codigo: 'esporotricose', nome: 'Esporotricose' },
    { codigo: 'raiva', nome: 'Raiva' },
  ],
  laboratorios: [
    { codigo: 'ial_sorocaba', nome: 'IAL — Sorocaba' },
    { codigo: 'pasteur_sp', nome: 'Pasteur — SP' },
  ],
  sintomas: [
    { codigo: 'apatia', nome: 'Apatia' },
    { codigo: 'coriza', nome: 'Coriza' },
  ],
  resultadosLaboratoriais: [
    { codigo: 'aguardando', nome: 'Aguardando' },
    { codigo: 'positivo', nome: 'Positivo' },
    { codigo: 'negativo', nome: 'Negativo' },
    { codigo: 'inconclusivo', nome: 'Inconclusivo' },
    { codigo: 'material_inadequado', nome: 'Material Inadequado' },
    { codigo: 'nao_realizado', nome: 'Não Realizado' },
  ],
  desfechos: [
    { codigo: 'em_acompanhamento', nome: 'Em acompanhamento' },
    { codigo: 'obito_natural', nome: 'Óbito — Natural' },
    { codigo: 'obito_eutanasia', nome: 'Óbito — Eutanásia' },
    { codigo: 'obito_outro', nome: 'Óbito — Outro' },
  ],
}

export function amostraFixture(sobrescrever: Partial<AmostraAnimal> = {}): AmostraAnimal {
  return {
    id: 'h9000000-0000-0000-0000-000000000001',
    animalId: null,
    especie: { codigo: 'canino', nome: 'Canino' },
    sexo: 'macho',
    raca: 'SRD',
    coloracao: 'Caramelo',
    pelagem: 'curta',
    idadeAprox: '3 anos',
    pesoKg: 12.5,
    statusClinico: 'SINTOMATICO',
    tipoAbrigo: 'PERIDOMICILIAR',
    alteracaoComportamental: 'Agressividade sem motivo aparente',
    dataColeta: '2026-05-18',
    materialBiologico: 'TECIDO_ENCEFALICO',
    contatoHumano: true,
    nivelContato: 'DIRETA',
    agrediuHumano: true,
    observacoes: 'Coleta pós-óbito',
    sintomas: [
      { codigo: 'apatia', nome: 'Apatia' },
      { codigo: 'coriza', nome: 'Coriza' },
    ],
    ...sobrescrever,
  }
}

export function processoFixture(sobrescrever: Partial<Processo> = {}): Processo {
  return {
    id: PROCESSO_PENDENTE_ID,
    protocolo: '045/2026',
    dataAbertura: '2026-05-18',
    ocorrenciaId: OCORRENCIA_PROCESSO_PENDENTE_ID,
    ocorrenciaProtocolo: '092/2026',
    urgente: true,
    statusProcesso: 'AGUARDANDO_RESULTADO',
    doenca: { codigo: 'raiva', nome: 'Raiva' },
    cid: 'A82',
    laboratorio: { codigo: 'pasteur_sp', nome: 'Pasteur — SP' },
    observacoes: 'Animal recolhido em via pública',
    responsavel: {
      id: 'h6000000-0000-0000-0000-000000000001',
      nome: 'Maria da Conceição',
      cpf: '123.456.789-00',
      telefone: '(11) 99999-0000',
      email: 'maria@exemplo.com',
      cep: '13300-000',
      endereco: 'Rua das Flores, 10',
      bairroResidencial: 'Centro',
      bairroOcorrencia: 'Vila Nova',
    },
    amostras: [amostraFixture()],
    resultadoLaboratorial: null,
    dataResultado: null,
    desfechoAnimal: null,
    criadoEm: '2026-05-18T09:00:00',
    ...sobrescrever,
  }
}

// T37: processo com resultado já lançado (write-once) — para os testes do
// modo somente-leitura/histórico do CardResultadoProcesso.
export function processoComResultadoFixture(sobrescrever: Partial<Processo> = {}): Processo {
  return processoFixture({
    statusProcesso: 'COM_RESULTADO',
    resultadoLaboratorial: { codigo: 'positivo', nome: 'Positivo' },
    dataResultado: '2026-05-20',
    desfechoAnimal: { codigo: 'obito_eutanasia', nome: 'Óbito — Eutanásia' },
    ...sobrescrever,
  })
}

// T37: GET /processos/:id/historico — eventos fixos (CRIACAO + ATUALIZACAO).
export function historicoProcessoFixture() {
  return [
    { id: 'hi000000-0000-0000-0000-000000000001', usuarioEmail: 'agente.teste@itu.sp.gov.br', acao: 'CRIACAO', ocorreuEm: '2026-05-18T09:00:00' },
    { id: 'hi000000-0000-0000-0000-000000000002', usuarioEmail: 'agente.teste@itu.sp.gov.br', acao: 'ATUALIZACAO', ocorreuEm: '2026-05-20T14:32:00' },
  ]
}

export function processoSemVinculoFixture(sobrescrever: Partial<Processo> = {}): Processo {
  return processoFixture({
    id: PROCESSO_SEM_VINCULO_ID,
    protocolo: '046/2026',
    dataAbertura: '2026-05-19',
    ocorrenciaId: null,
    ocorrenciaProtocolo: null,
    urgente: false,
    statusProcesso: 'ABERTO',
    doenca: { codigo: 'esporotricose', nome: 'Esporotricose' },
    cid: 'B42',
    amostras: [
      amostraFixture({
        id: 'h9000000-0000-0000-0000-000000000002',
        animalId: ANIMAL_AMOSTRADO_ID,
        especie: { codigo: 'felino', nome: 'Felino' },
        sexo: 'femea',
        statusClinico: 'ASSINTOMATICO',
        materialBiologico: 'SANGUE',
        contatoHumano: false,
        nivelContato: null,
        agrediuHumano: null,
        alteracaoComportamental: null,
        observacoes: null,
        sintomas: [],
      }),
    ],
    ...sobrescrever,
  })
}

export function processosFixture(): Processo[] {
  return [processoFixture(), processoSemVinculoFixture()]
}

export function paraResumoProcesso(processo: Processo): ProcessoResumo {
  return {
    id: processo.id,
    protocolo: processo.protocolo,
    dataAbertura: processo.dataAbertura,
    doenca: processo.doenca,
    statusProcesso: processo.statusProcesso,
    urgente: processo.urgente,
    ocorrenciaId: processo.ocorrenciaId,
    ocorrenciaProtocolo: processo.ocorrenciaProtocolo,
  }
}

// Resposta fixa do POST /processos.
export function processoCriadoFixture(): Processo {
  return processoFixture({ id: PROCESSO_CRIADO_ID, protocolo: '047/2026', statusProcesso: 'ABERTO' })
}

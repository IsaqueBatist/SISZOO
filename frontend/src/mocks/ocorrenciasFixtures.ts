import type {
  AnexoOcorrencia,
  CatalogosOcorrencia,
  Denunciante,
  Ocorrencia,
  OcorrenciaResumo,
  ProcessoSanitario,
} from '@/features/ocorrencias/types/ocorrencias.types'

// Fixtures FIXAS da API de ocorrências, só para os testes (T25, PR2). Os dados
// são fictícios. Nenhuma regra de negócio é simulada aqui: a máscara de
// sigilo, as transições e o protocolo são do backend (e testados lá). Cada
// cenário traz `podeVerDenunciante` e os campos já como o backend os
// devolveria; quem precisa de outra resposta usa `server.use()` no teste.
// As datas são LocalDate/LocalDateTime sem fuso, já no horário do CCZ.

export const OCORRENCIA_ABERTA_ID = 'h5000000-0000-0000-0000-000000000001'
export const OCORRENCIA_SIGILOSA_ID = 'h5000000-0000-0000-0000-000000000002'
export const OCORRENCIA_ANONIMA_ID = 'h5000000-0000-0000-0000-000000000003'
export const OCORRENCIA_PROCESSO_PENDENTE_ID = 'h5000000-0000-0000-0000-000000000004'
export const OCORRENCIA_ENCERRADA_ID = 'h5000000-0000-0000-0000-000000000005'
export const PROCESSO_PENDENTE_ID = 'h7000000-0000-0000-0000-000000000001'
export const ANEXO_ENCERRADA_ID = 'h8000000-0000-0000-0000-000000000001'

const AGENTE_ID = 'a1b2c3d4-0000-0000-0000-000000000002'
const AGENTE_NOME = 'Rafael Santos'
const VETERINARIA_ID = 'a1b2c3d4-0000-0000-0000-000000000003'
const VETERINARIA_NOME = 'Stéphanie Lima'

export const DENUNCIANTE_MASCARADO: Denunciante = {
  nome: null,
  cpf: null,
  telefone: null,
  email: null,
  cep: null,
  endereco: null,
  bairroResidencial: null,
}

export const DENUNCIANTE_SIGILOSO_VISIVEL: Denunciante = {
  nome: 'João Pereira Lima',
  cpf: '987.654.321-00',
  telefone: '(11) 91234-5678',
  email: 'joao.pereira@email.com',
  cep: '13302-100',
  endereco: 'Rua das Camélias, 88',
  bairroResidencial: 'Jardim Bela Vista',
}

// Base com todos os campos do contrato; cada fixture sobrescreve o que muda.
export function criarOcorrenciaFixture(sobrescrever: Partial<Ocorrencia> = {}): Ocorrencia {
  return {
    id: OCORRENCIA_ABERTA_ID,
    protocolo: '089/2026',
    tipoOcorrencia: 'zoonose',
    tipoOcorrenciaNome: 'Suspeita de Zoonose',
    statusOcorrencia: 'ABERTA',
    dataAbertura: '2026-05-20',
    horaAbertura: '10:32:00',
    endereco: 'Rua das Acácias, 145',
    bairro: 'Vila Esperança',
    pontoReferencia: 'Esquina com a Rua dos Ipês',
    descricao:
      'Munícipe relata cão de pelagem caramelo com sinais comportamentais incomuns: salivação excessiva, ataxia e hipersensibilidade a luz e ruídos. O animal não é de sua propriedade.',
    urgente: false,
    sigilosa: false,
    anonima: false,
    latitude: null,
    longitude: null,
    registradoPorId: AGENTE_ID,
    registradoPorNome: AGENTE_NOME,
    providenciaTomada: null,
    providenciaTomadaNome: null,
    descricaoEncerramento: null,
    encerradaEm: null,
    encerradaPorNome: null,
    processoVinculado: null,
    denunciante: {
      nome: 'Maria Souza Oliveira',
      cpf: '123.456.789-09',
      telefone: '(11) 98765-4321',
      email: 'maria.souza@email.com',
      cep: '13301-000',
      endereco: 'Rua dos Ipês, 220',
      bairroResidencial: 'Vila Esperança',
    },
    denunciado: null,
    movimentacoes: [
      {
        id: 'h6000000-0000-0000-0000-000000000001',
        tipoMovimentacao: 'REGISTRADA',
        statusAnterior: null,
        statusNovo: 'ABERTA',
        data: '2026-05-20T10:32:00',
        descricao: 'Denúncia recebida via telefone (0800-CCZ-ITU).',
        usuarioId: AGENTE_ID,
        usuarioNome: AGENTE_NOME,
      },
    ],
    anexos: [],
    podeVerDenunciante: true,
    criadoEm: '2026-05-20T10:32:00',
    atualizadoEm: '2026-05-20T10:32:00',
    ...sobrescrever,
  }
}

// Sigilosa como o backend devolve para quem NÃO tem a permissão de sigilo
// (Vet). Para o cenário com permissão (Admin/Agente), usar
// `ocorrenciaSigilosaVisivel()`.
export function ocorrenciaSigilosaMascarada(): Ocorrencia {
  return criarOcorrenciaFixture({
    id: OCORRENCIA_SIGILOSA_ID,
    protocolo: '090/2026',
    tipoOcorrencia: 'irregular',
    tipoOcorrenciaNome: 'Criação Irregular',
    dataAbertura: '2026-05-21',
    horaAbertura: '09:10:00',
    endereco: 'Rua das Palmeiras, 300',
    bairro: 'Jardim Bela Vista',
    pontoReferencia: null,
    descricao: 'Denúncia de maus-tratos a animal em quintal vizinho. Denunciante pediu sigilo.',
    sigilosa: true,
    denunciante: DENUNCIANTE_MASCARADO,
    podeVerDenunciante: false,
    movimentacoes: [
      {
        id: 'h6000000-0000-0000-0000-000000000002',
        tipoMovimentacao: 'REGISTRADA',
        statusAnterior: null,
        statusNovo: 'ABERTA',
        data: '2026-05-21T09:10:00',
        descricao: 'Denúncia registrada via formulário interno.',
        usuarioId: AGENTE_ID,
        usuarioNome: AGENTE_NOME,
      },
    ],
    anexos: [
      {
        id: 'h8000000-0000-0000-0000-000000000002',
        nome: 'Foto do quintal.jpg',
        mimeType: 'image/jpeg',
        tamanho: 1_200_000,
        criadoEm: '2026-05-21T09:12:00',
      },
    ],
    criadoEm: '2026-05-21T09:10:00',
    atualizadoEm: '2026-05-21T09:10:00',
  })
}

export function ocorrenciaSigilosaVisivel(): Ocorrencia {
  return { ...ocorrenciaSigilosaMascarada(), denunciante: DENUNCIANTE_SIGILOSO_VISIVEL, podeVerDenunciante: true }
}

export function ocorrenciaAnonima(): Ocorrencia {
  return criarOcorrenciaFixture({
    id: OCORRENCIA_ANONIMA_ID,
    protocolo: '091/2026',
    tipoOcorrencia: 'morcegos',
    tipoOcorrenciaNome: 'Infestação de Morcegos',
    dataAbertura: '2026-05-19',
    horaAbertura: null,
    endereco: 'Rua do Comércio, 51',
    bairro: 'Centro',
    pontoReferencia: null,
    descricao: 'Morcegos no forro de imóvel comercial, relato por telefone sem identificação.',
    anonima: true,
    denunciante: null,
    movimentacoes: [
      {
        id: 'h6000000-0000-0000-0000-000000000003',
        tipoMovimentacao: 'REGISTRADA',
        statusAnterior: null,
        statusNovo: 'ABERTA',
        data: '2026-05-19T15:00:00',
        descricao: null,
        usuarioId: AGENTE_ID,
        usuarioNome: AGENTE_NOME,
      },
    ],
    criadoEm: '2026-05-19T15:00:00',
    atualizadoEm: '2026-05-19T15:00:00',
  })
}

export function ocorrenciaProcessoPendente(): Ocorrencia {
  return criarOcorrenciaFixture({
    id: OCORRENCIA_PROCESSO_PENDENTE_ID,
    protocolo: '092/2026',
    statusOcorrencia: 'EM_ATENDIMENTO',
    dataAbertura: '2026-05-18',
    horaAbertura: '08:00:00',
    endereco: 'Avenida Brasil, 900',
    bairro: 'Centro',
    pontoReferencia: 'Próximo ao mercado municipal',
    descricao: 'Cão errante com suspeita de raiva, amostra encaminhada para investigação laboratorial.',
    urgente: true,
    processoVinculado: {
      id: PROCESSO_PENDENTE_ID,
      protocolo: '045/2026',
      statusProcesso: 'AGUARDANDO_RESULTADO',
      urgente: true,
    },
    denunciante: {
      nome: 'Carla Mendes',
      cpf: '111.222.333-96',
      telefone: '(11) 92222-3333',
      email: 'carla.mendes@email.com',
      cep: '13300-000',
      endereco: 'Avenida Brasil, 850',
      bairroResidencial: 'Centro',
    },
    movimentacoes: [
      {
        id: 'h6000000-0000-0000-0000-000000000004',
        tipoMovimentacao: 'PROCESSO_VINCULADO',
        statusAnterior: null,
        statusNovo: null,
        data: '2026-05-18T11:32:00',
        descricao: 'Processo sanitário PS 045/2026 aberto.',
        usuarioId: VETERINARIA_ID,
        usuarioNome: VETERINARIA_NOME,
      },
      {
        id: 'h6000000-0000-0000-0000-000000000011',
        tipoMovimentacao: 'EQUIPE_DESPACHADA',
        statusAnterior: 'ABERTA',
        statusNovo: 'EM_ATENDIMENTO',
        data: '2026-05-18T09:00:00',
        descricao: null,
        usuarioId: AGENTE_ID,
        usuarioNome: AGENTE_NOME,
      },
      {
        id: 'h6000000-0000-0000-0000-000000000005',
        tipoMovimentacao: 'REGISTRADA',
        statusAnterior: null,
        statusNovo: 'ABERTA',
        data: '2026-05-18T08:00:00',
        descricao: 'Denúncia recebida via telefone (0800-CCZ-ITU).',
        usuarioId: AGENTE_ID,
        usuarioNome: AGENTE_NOME,
      },
    ],
    criadoEm: '2026-05-18T08:00:00',
    atualizadoEm: '2026-05-18T11:32:00',
  })
}

export function ocorrenciaEncerrada(): Ocorrencia {
  return criarOcorrenciaFixture({
    id: OCORRENCIA_ENCERRADA_ID,
    protocolo: '070/2026',
    tipoOcorrencia: 'agressivo',
    tipoOcorrenciaNome: 'Animal Agressivo',
    statusOcorrencia: 'ENCERRADA',
    dataAbertura: '2026-05-10',
    horaAbertura: '08:00:00',
    endereco: 'Rua dos Girassóis, 40',
    bairro: 'Parque das Flores',
    pontoReferencia: null,
    descricao: 'Cão de grande porte solto, sem coleira, rondando escola municipal.',
    providenciaTomada: 'captura_remocao',
    providenciaTomadaNome: 'Captura e remoção',
    descricaoEncerramento: 'Animal capturado e encaminhado ao CCZ para observação.',
    encerradaEm: '2026-05-12T13:00:00',
    encerradaPorNome: VETERINARIA_NOME,
    denunciante: {
      nome: 'Escola Municipal Parque das Flores',
      cpf: null,
      telefone: '(11) 4023-0000',
      email: null,
      cep: '13303-000',
      endereco: 'Rua dos Girassóis, 10',
      bairroResidencial: 'Parque das Flores',
    },
    movimentacoes: [
      {
        id: 'h6000000-0000-0000-0000-000000000006',
        tipoMovimentacao: 'ENCERRADA',
        statusAnterior: 'EM_ATENDIMENTO',
        statusNovo: 'ENCERRADA',
        data: '2026-05-12T13:00:00',
        descricao: 'Providência: Captura e remoção',
        usuarioId: VETERINARIA_ID,
        usuarioNome: VETERINARIA_NOME,
      },
      {
        id: 'h6000000-0000-0000-0000-000000000007',
        tipoMovimentacao: 'EQUIPE_DESPACHADA',
        statusAnterior: 'ABERTA',
        statusNovo: 'EM_ATENDIMENTO',
        data: '2026-05-11T06:00:00',
        descricao: null,
        usuarioId: AGENTE_ID,
        usuarioNome: AGENTE_NOME,
      },
      {
        id: 'h6000000-0000-0000-0000-000000000008',
        tipoMovimentacao: 'REGISTRADA',
        statusAnterior: null,
        statusNovo: 'ABERTA',
        data: '2026-05-10T08:00:00',
        descricao: 'Denúncia recebida presencialmente.',
        usuarioId: AGENTE_ID,
        usuarioNome: AGENTE_NOME,
      },
    ],
    anexos: [
      {
        id: ANEXO_ENCERRADA_ID,
        nome: 'Foto do animal.jpg',
        mimeType: 'image/jpeg',
        tamanho: 2_500_000,
        criadoEm: '2026-05-10T08:05:00',
      },
    ],
    criadoEm: '2026-05-10T08:00:00',
    atualizadoEm: '2026-05-12T13:00:00',
  })
}

// Resposta padrão de GET /ocorrencias/{id}: a sigilosa vem mascarada (o
// cenário mais restritivo); teste que precise da visão com permissão troca
// com `server.use()`.
export function ocorrenciasFixture(): Ocorrencia[] {
  return [
    ocorrenciaAbertaFixture(),
    ocorrenciaSigilosaMascarada(),
    ocorrenciaAnonima(),
    ocorrenciaProcessoPendente(),
    ocorrenciaEncerrada(),
  ]
}

export function ocorrenciaAbertaFixture(): Ocorrencia {
  return criarOcorrenciaFixture()
}

// Projeção campo a campo do detalhe para a linha da listagem, como o backend
// a monta: `denuncianteNome` é nulo em toda sigilosa, para qualquer perfil
// (T26, revisão da D14), e na anônima (não há denunciante).
export function paraResumoFixture(ocorrencia: Ocorrencia): OcorrenciaResumo {
  return {
    id: ocorrencia.id,
    protocolo: ocorrencia.protocolo,
    tipoOcorrencia: ocorrencia.tipoOcorrencia,
    tipoOcorrenciaNome: ocorrencia.tipoOcorrenciaNome,
    statusOcorrencia: ocorrencia.statusOcorrencia,
    dataAbertura: ocorrencia.dataAbertura,
    bairro: ocorrencia.bairro,
    urgente: ocorrencia.urgente,
    sigilosa: ocorrencia.sigilosa,
    anonima: ocorrencia.anonima,
    denuncianteNome: ocorrencia.sigilosa ? null : (ocorrencia.denunciante?.nome ?? null),
    processoProtocolo: ocorrencia.processoVinculado?.protocolo ?? null,
    podeVerDenunciante: ocorrencia.podeVerDenunciante,
  }
}

// Ordem fixa, já como o backend devolveria (urgentes primeiro, D31).
export function resumosFixture(): OcorrenciaResumo[] {
  const [aberta, sigilosa, anonima, pendente, encerrada] = ocorrenciasFixture()
  return [pendente, sigilosa, aberta, anonima, encerrada].map(paraResumoFixture)
}

export const CATALOGOS_OCORRENCIA_FIXTURE: CatalogosOcorrencia = {
  tiposOcorrencia: [
    { codigo: 'zoonose', nome: 'Suspeita de Zoonose' },
    { codigo: 'morcegos', nome: 'Infestação de Morcegos' },
    { codigo: 'irregular', nome: 'Criação Irregular' },
    { codigo: 'agressivo', nome: 'Animal Agressivo' },
    { codigo: 'outros', nome: 'Outros' },
  ],
  providencias: [
    { codigo: 'orientacao_municipe', nome: 'Orientação ao munícipe' },
    { codigo: 'encaminhamento_gepar', nome: 'Encaminhamento ao GEPAR' },
    { codigo: 'abertura_processo', nome: 'Abertura de processo sanitário' },
    { codigo: 'captura_remocao', nome: 'Captura e remoção' },
    { codigo: 'sem_acao', nome: 'Sem ação necessária' },
    { codigo: 'outro', nome: 'Outro' },
    { codigo: 'registro_indevido', nome: 'Registro duplicado/indevido' },
  ],
}

// Resposta fixa do POST /ocorrencias (uma ocorrência nova qualquer).
export const OCORRENCIA_CRIADA_ID = 'h5000000-0000-0000-0000-000000000099'
export function ocorrenciaCriadaFixture(): Ocorrencia {
  return criarOcorrenciaFixture({ id: OCORRENCIA_CRIADA_ID, protocolo: '100/2026', anexos: [] })
}

export const ANEXO_CRIADO_FIXTURE: AnexoOcorrencia = {
  id: 'h8000000-0000-0000-0000-000000000099',
  nome: 'foto.jpg',
  mimeType: 'image/jpeg',
  tamanho: 1024,
  criadoEm: '2026-05-20T10:40:00',
}

export const PROCESSO_CRIADO_FIXTURE: ProcessoSanitario = {
  id: 'h7000000-0000-0000-0000-000000000099',
  protocolo: '046/2026',
  dataAbertura: '2026-05-20',
  ocorrenciaId: OCORRENCIA_ABERTA_ID,
  urgente: false,
  statusProcesso: 'ABERTO',
  criadoEm: '2026-05-20T10:45:00',
}

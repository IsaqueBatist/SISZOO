import type { RoleKey } from '@/lib/nav'
import { buscarOcorrenciaMockPorId, vincularProcessoNaOcorrenciaMock } from '@/features/ocorrencias/api/ocorrenciasMockStore'
import type { PaginaResponse } from '@/features/usuarios/types/usuarios.types'
import type {
  AmostraAnimal,
  AnexarDocumentoRequest,
  CriarProcessoRequest,
  Doenca,
  DocumentoProcesso,
  EnviarAmostrasRequest,
  MaterialBiologico,
  OcorrenciaParaVinculo,
  Processo,
  ProcessosFiltro,
  RegistrarResultadoRequest,
  StatusProcesso,
} from '../types/processos.types'

// PROVISÓRIO: mock autoral da feature de processos — o backend real ainda
// não existe (com.siszoo.processos só tem pastas .gitkeep). Store local em
// memória, síncrono, mesmo padrão de ocorrenciasMockStore.ts: sempre devolve
// cópias (structuredClone), nunca a referência viva do array.

// Id fixo do processo vinculado à ocorrência sigilosa semeada em
// ocorrenciasMockStore.ts (OCORRENCIA_SIGILOSA_COM_PROCESSO_ID) — usado nos
// dois lados do vínculo para exercitar RN4 (sigilo) de ponta a ponta, sem
// tocar nas ocorrências já semeadas na T28 (090/2026 continua sem processo,
// os testes de SeletorOcorrencia dependem dela estar livre).
export const PROCESSO_SIGILOSO_ID = 'p1000000-0000-0000-0000-000000000005'
const OCORRENCIA_SIGILOSA_COM_PROCESSO_ID = 'h5000000-0000-0000-0000-000000000006'

const VETERINARIA_PADRAO = 'Stéphanie Lima'
const AGENTE_PADRAO = 'Rafael Santos'

function amostraExterna(params: {
  contatoHumano: boolean
  dataColeta: string
  materialBiologico?: MaterialBiologico
}): AmostraAnimal {
  return {
    origem: 'externo',
    especieId: 'canino',
    sexo: 'nao_identificado',
    statusClinico: params.contatoHumano ? 'sintomatico' : 'assintomatico',
    tipoAbrigo: 'nao_identificado',
    dataColeta: params.dataColeta,
    materialBiologico: params.materialBiologico ?? 'sangue',
    contatoHumano: params.contatoHumano,
    nivelContato: params.contatoHumano ? 'direta' : undefined,
    agrediuHumano: params.contatoHumano ? false : undefined,
    sintomas: params.contatoHumano ? ['salivacao_excessiva'] : [],
  }
}

// Único animal_amostrado com origem 'canil' do seed — referencia o Rex
// (b2c3d4e5-...0001) semeado em src/mocks/handlers.ts, para o link "Ver
// ficha" do detalhe do processo resolver de verdade em teste manual.
function amostraCanilRex(): AmostraAnimal {
  return {
    origem: 'canil',
    animalId: 'b2c3d4e5-0000-0000-0000-000000000001',
    especieId: 'canino',
    sexo: 'macho',
    raca: 'SRD',
    coloracao: 'Caramelo',
    idadeAprox: '3 anos',
    statusClinico: 'sintomatico',
    tipoAbrigo: 'intradomiciliar',
    dataColeta: '2026-09-20',
    materialBiologico: 'tecido_encefalico',
    contatoHumano: true,
    nivelContato: 'direta',
    agrediuHumano: true,
    sintomas: ['salivacao_excessiva', 'alt_comportamental'],
  }
}

function documento(id: string, nome: string, tipo: DocumentoProcesso['tipo'], criadoEm: string): DocumentoProcesso {
  return {
    id,
    nome,
    url: '#',
    tipo,
    tamanho: 184_000,
    mimeType: 'application/pdf',
    criadoEm,
    criadoPorNome: VETERINARIA_PADRAO,
  }
}

const DOENCAS_CICLO: Doenca[] = [
  'raiva',
  'esporotricose',
  'leishmaniose_visceral',
  'leptospirose',
  'febre_maculosa',
  'febre_amarela',
]

const STATUS_CICLO: StatusProcesso[] = ['aberto', 'aguardando_resultado', 'com_resultado', 'concluido']

// Lote genérico só pra garantir >1 página na listagem (RN3) — sem
// significado clínico, cicla doença/status/urgência de forma determinística
// (sem Math.random, pra manter os testes previsíveis).
function seedProcessosGenericos(): Processo[] {
  const itens: Processo[] = []
  for (let i = 0; i < 16; i++) {
    const numero = i + 9 // continua depois dos 8 casos especiais (001-008)
    const doenca = DOENCAS_CICLO[i % DOENCAS_CICLO.length]
    const statusProcesso = STATUS_CICLO[i % STATUS_CICLO.length]
    const urgente = i % 3 === 0
    const dataAbertura = `2026-0${(i % 9) + 1}-${String((i % 27) + 1).padStart(2, '0')}`
    const temResultado = statusProcesso === 'com_resultado' || statusProcesso === 'concluido'
    itens.push({
      id: `p1000000-0000-0000-0000-0000000000${String(numero).padStart(2, '0')}`,
      protocolo: `${String(numero).padStart(3, '0')}/2026`,
      dataAbertura,
      doenca,
      laboratorio: 'itu_ll01',
      ocorrenciaVinculado: null,
      statusProcesso,
      urgente,
      responsavel: { nome: `Munícipe Genérico ${numero}`, bairroResidencial: 'Centro' },
      amostras: [amostraExterna({ contatoHumano: urgente, dataColeta: dataAbertura })],
      criadoPorNome: i % 2 === 0 ? VETERINARIA_PADRAO : AGENTE_PADRAO,
      criadoEm: `${dataAbertura}T09:00:00Z`,
      atualizadoEm: `${dataAbertura}T09:00:00Z`,
      resultadoLaboratorial: temResultado ? 'negativo' : undefined,
      dataResultado: temResultado ? dataAbertura : undefined,
      documentos: [],
    })
  }
  return itens
}

function seedProcessosMock(): Processo[] {
  return [
    {
      id: 'p1000000-0000-0000-0000-000000000001',
      protocolo: '001/2026',
      dataAbertura: '2026-09-20',
      doenca: 'raiva',
      laboratorio: 'pasteur_sp',
      ocorrenciaVinculado: null,
      statusProcesso: 'aberto',
      urgente: true,
      galNumero: 'GAL-2026-08712',
      sinanNumero: 'SIN-04451-26',
      cid: 'A82',
      dataEnvioAmostras: '2026-09-20T16:40:00Z',
      previsaoRetorno: '2026-09-27',
      responsavel: {
        nome: 'Maria Souza Oliveira',
        telefone: '(11) 9 8765-4321',
        bairroResidencial: 'Vila Esperança',
        bairroOcorrencia: 'Vila Esperança',
      },
      amostras: [amostraCanilRex()],
      criadoPorNome: VETERINARIA_PADRAO,
      criadoEm: '2026-09-20T16:40:00Z',
      atualizadoEm: '2026-09-20T16:40:00Z',
      documentos: [],
    },
    {
      id: 'p1000000-0000-0000-0000-000000000002',
      protocolo: '002/2026',
      dataAbertura: '2026-08-01',
      doenca: 'leishmaniose_visceral',
      laboratorio: 'ial_sorocaba',
      ocorrenciaVinculado: null,
      statusProcesso: 'com_resultado',
      urgente: true,
      galNumero: 'GAL-2026-07310',
      sinanNumero: 'SIN-03980-26',
      cid: 'B55.0',
      resultadoLaboratorial: 'positivo',
      dataResultado: '2026-08-09',
      desfechoAnimal: 'obito_natural',
      responsavel: { nome: 'Carla Mendes', telefone: '(11) 9 2222-3333', bairroResidencial: 'Centro' },
      amostras: [
        amostraExterna({ contatoHumano: true, dataColeta: '2026-08-01', materialBiologico: 'soro' }),
      ],
      criadoPorNome: VETERINARIA_PADRAO,
      criadoEm: '2026-08-01T10:00:00Z',
      atualizadoEm: '2026-08-09T14:00:00Z',
      documentos: [documento('doc-0001', 'Ficha de Investigação Sanitária — 002-2026.pdf', 'ficha_investigacao', '2026-08-01T10:05:00Z')],
    },
    {
      id: 'p1000000-0000-0000-0000-000000000003',
      protocolo: '003/2026',
      dataAbertura: '2026-07-15',
      doenca: 'leptospirose',
      laboratorio: 'ccz_sp',
      ocorrenciaVinculado: null,
      statusProcesso: 'concluido',
      urgente: false,
      cid: 'A27',
      resultadoLaboratorial: 'negativo',
      dataResultado: '2026-07-22',
      desfechoAnimal: 'em_acompanhamento',
      responsavel: { nome: 'Escola Municipal Parque das Flores', bairroResidencial: 'Parque das Flores' },
      amostras: [amostraExterna({ contatoHumano: false, dataColeta: '2026-07-15', materialBiologico: 'urina' })],
      criadoPorNome: AGENTE_PADRAO,
      criadoEm: '2026-07-15T08:00:00Z',
      atualizadoEm: '2026-07-22T11:00:00Z',
      documentos: [
        documento('doc-0002', 'Termo de envio CCZ-SP.pdf', 'termo_envio', '2026-07-15T08:10:00Z'),
        documento('doc-0003', 'Fotos da coleta.pdf', 'foto_coleta', '2026-07-15T08:12:00Z'),
      ],
    },
    {
      id: 'p1000000-0000-0000-0000-000000000004',
      protocolo: '004/2026',
      dataAbertura: '2026-07-10',
      doenca: 'esporotricose',
      laboratorio: 'itu_ll01',
      ocorrenciaVinculado: null,
      // RN2/DER.md:508: urgente não depende do status — continua true mesmo
      // com o processo concluído, porque é derivado só do contato humano.
      statusProcesso: 'concluido',
      urgente: true,
      cid: 'B42',
      resultadoLaboratorial: 'inconclusivo',
      dataResultado: '2026-07-18',
      desfechoAnimal: 'obito_eutanasia',
      responsavel: { nome: 'João Pedro Alves', bairroResidencial: 'Jardim Bela Vista' },
      amostras: [amostraExterna({ contatoHumano: true, dataColeta: '2026-07-10', materialBiologico: 'saliva' })],
      criadoPorNome: VETERINARIA_PADRAO,
      criadoEm: '2026-07-10T09:00:00Z',
      atualizadoEm: '2026-07-18T15:00:00Z',
      documentos: [],
    },
    {
      id: PROCESSO_SIGILOSO_ID,
      protocolo: '005/2026',
      dataAbertura: '2026-05-22',
      doenca: 'febre_maculosa',
      laboratorio: 'pasteur_sp',
      // Snapshot somente-leitura gravado quando o processo foi vinculado —
      // mesmo padrão de criarProcessoMock::paraResumoVinculo. O nome do
      // denunciante vem "cru" aqui; o mascaramento por perfil acontece em
      // mascarar(), na hora de exibir (RN4), nunca na hora de gravar.
      ocorrenciaVinculado: {
        id: OCORRENCIA_SIGILOSA_COM_PROCESSO_ID,
        protocolo: '095/2026',
        tipoOcorrencia: 'zoonose',
        bairro: 'Jardim Bela Vista',
        statusOcorrencia: 'em_atendimento',
        sigilosa: true,
        denunciante: { nome: 'Renata Costa Almeida' },
      },
      statusProcesso: 'aguardando_resultado',
      urgente: false,
      cid: 'A77',
      dataEnvioAmostras: '2026-05-22T13:00:00Z',
      previsaoRetorno: '2026-05-29',
      // Responsável (munícipe dono do animal) e denunciante da ocorrência
      // podem ser pessoas diferentes (DER.md:540) — nomes distintos de
      // propósito, pra não colidir em teste com o campo mascarado por RN4.
      responsavel: { nome: 'Marcelo Tavares', bairroResidencial: 'Jardim Bela Vista' },
      amostras: [amostraExterna({ contatoHumano: false, dataColeta: '2026-05-22', materialBiologico: 'sangue' })],
      criadoPorNome: VETERINARIA_PADRAO,
      criadoEm: '2026-05-22T13:00:00Z',
      atualizadoEm: '2026-05-22T13:00:00Z',
      documentos: [],
    },
    {
      id: 'p1000000-0000-0000-0000-000000000006',
      protocolo: '006/2026',
      dataAbertura: '2026-09-25',
      doenca: 'febre_amarela',
      laboratorio: 'ial_sorocaba',
      ocorrenciaVinculado: null,
      statusProcesso: 'aberto',
      urgente: false,
      cid: 'A95',
      responsavel: { nome: 'Pedro Nunes', bairroResidencial: 'Centro' },
      amostras: [amostraExterna({ contatoHumano: false, dataColeta: '2026-09-25', materialBiologico: 'sangue' })],
      criadoPorNome: AGENTE_PADRAO,
      criadoEm: '2026-09-25T08:30:00Z',
      atualizadoEm: '2026-09-25T08:30:00Z',
      documentos: [],
    },
    {
      id: 'p1000000-0000-0000-0000-000000000007',
      protocolo: '007/2026',
      dataAbertura: '2026-06-05',
      doenca: 'raiva',
      laboratorio: 'pasteur_sp',
      ocorrenciaVinculado: null,
      statusProcesso: 'com_resultado',
      urgente: false,
      cid: 'A82',
      resultadoLaboratorial: 'inconclusivo',
      dataResultado: '2026-06-12',
      responsavel: { nome: 'Fábio Ramos', bairroResidencial: 'Vila Esperança' },
      amostras: [amostraExterna({ contatoHumano: false, dataColeta: '2026-06-05', materialBiologico: 'tecido_encefalico' })],
      criadoPorNome: VETERINARIA_PADRAO,
      criadoEm: '2026-06-05T10:00:00Z',
      atualizadoEm: '2026-06-12T09:00:00Z',
      documentos: [],
    },
    {
      id: 'p1000000-0000-0000-0000-000000000008',
      protocolo: '008/2026',
      dataAbertura: '2026-09-01',
      doenca: 'leptospirose',
      laboratorio: 'ccz_sp',
      ocorrenciaVinculado: null,
      statusProcesso: 'aguardando_resultado',
      urgente: true,
      cid: 'A27',
      dataEnvioAmostras: '2026-09-01T11:00:00Z',
      previsaoRetorno: '2026-09-10',
      responsavel: { nome: 'Beatriz Ferreira', bairroResidencial: 'Centro' },
      amostras: [amostraExterna({ contatoHumano: true, dataColeta: '2026-09-01', materialBiologico: 'urina' })],
      criadoPorNome: AGENTE_PADRAO,
      criadoEm: '2026-09-01T11:00:00Z',
      atualizadoEm: '2026-09-01T11:00:00Z',
      documentos: [],
    },
    ...seedProcessosGenericos(),
  ]
}

let processosMock: Processo[] = seedProcessosMock()

export function resetProcessosMock() {
  processosMock = seedProcessosMock()
}

function paginar<T>(itens: T[], pagina: number, tamanho: number): PaginaResponse<T> {
  const totalItens = itens.length
  const totalPaginas = Math.max(Math.ceil(totalItens / tamanho), 1)
  const inicio = pagina * tamanho
  return { itens: itens.slice(inicio, inicio + tamanho), pagina, tamanho, totalItens, totalPaginas }
}

// RN4: mascara o denunciante da ocorrência vinculada para perfis ≠ admin,
// mesma convenção de ocorrenciasMockStore.ts::mascarar — nome vira null,
// "Sigiloso" continua distinguível de "—" porque `sigilosa` não muda.
function mascarar(processo: Processo, roleKey: RoleKey): Processo {
  if (!processo.ocorrenciaVinculado?.sigilosa || roleKey === 'admin') {
    return structuredClone(processo)
  }
  return structuredClone({
    ...processo,
    ocorrenciaVinculado: { ...processo.ocorrenciaVinculado, denunciante: { nome: null } },
  })
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
    // Processo recém-criado nunca nasce com resultado/documentos — ambos
    // fora do escopo de registro nesta feature (RN6, T33 é só leitura).
    documentos: [],
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

export function listarProcessosMock(filtro: ProcessosFiltro, roleKey: RoleKey): PaginaResponse<Processo> {
  const mascarados = processosMock.map((item) => mascarar(item, roleKey))
  const q = filtro.q?.trim().toLowerCase()
  const filtrados = mascarados.filter((item) => {
    const combinaDoenca = !filtro.doenca || item.doenca === filtro.doenca
    const combinaStatus = !filtro.statusProcesso || item.statusProcesso === filtro.statusProcesso
    const combinaBusca = !q || item.protocolo.toLowerCase().includes(q) || item.responsavel.nome.toLowerCase().includes(q)
    return combinaDoenca && combinaStatus && combinaBusca
  })
  // RN3: urgentes no topo (independente do status, ver §2.4 do plano),
  // critério secundário = data de abertura desc. Ordena o conjunto inteiro
  // ANTES de paginar, pra ficar estável entre páginas e combinado com os
  // filtros.
  const ordenados = [...filtrados].sort((a, b) => {
    if (a.urgente !== b.urgente) return a.urgente ? -1 : 1
    return b.dataAbertura.localeCompare(a.dataAbertura)
  })
  return paginar(ordenados, filtro.pagina, filtro.tamanho)
}

export function buscarProcessoMockPorId(id: string, roleKey: RoleKey): Processo | null {
  const encontrado = processosMock.find((item) => item.id === id)
  return encontrado ? mascarar(encontrado, roleKey) : null
}

// Repassa o status/resultado atualizado do processo pro lado da ocorrência
// vinculada (quando existe), reaproveitando `vincularProcessoNaOcorrenciaMock`
// — a mesma função usada na criação, chamada de novo aqui só pra sobrescrever
// os campos que mudaram. `resultadoPendente` é a peça que faltava pra regra
// 13 ("não pode encerrar com processo pendente") algum dia virar `false`:
// antes desta mudança, nada no sistema zerava esse campo depois da criação.
function sincronizarVinculoNaOcorrencia(processo: Processo): void {
  if (!processo.ocorrenciaVinculado) return
  vincularProcessoNaOcorrenciaMock(processo.ocorrenciaVinculado.id, {
    id: processo.id,
    protocolo: processo.protocolo,
    statusProcesso: processo.statusProcesso,
    resultadoPendente: !processo.resultadoLaboratorial,
  })
}

export type ResultadoTransicaoProcesso =
  | { ok: true; processo: Processo }
  | { ok: false; motivo: 'nao_encontrado' | 'status_invalido' }

// DER.md não define os gatilhos de cada transição de status — ver "Riscos e
// pendências" do plano. aberto → aguardando_resultado.
export function enviarAmostrasMock(id: string, payload: EnviarAmostrasRequest): ResultadoTransicaoProcesso {
  const atual = processosMock.find((item) => item.id === id)
  if (!atual) return { ok: false, motivo: 'nao_encontrado' }
  if (atual.statusProcesso !== 'aberto') return { ok: false, motivo: 'status_invalido' }

  const agora = new Date().toISOString()
  const atualizado: Processo = {
    ...atual,
    statusProcesso: 'aguardando_resultado',
    dataEnvioAmostras: agora,
    previsaoRetorno: payload.previsaoRetorno ?? atual.previsaoRetorno,
    atualizadoEm: agora,
  }
  processosMock = processosMock.map((item) => (item.id === id ? atualizado : item))
  sincronizarVinculoNaOcorrencia(atualizado)
  return { ok: true, processo: structuredClone(atualizado) }
}

// aguardando_resultado → com_resultado. Write-once: o guard de status já
// impede uma segunda chamada no fluxo normal (uma vez registrado, o
// processo não está mais em 'aguardando_resultado'), então não precisa de
// um motivo de rejeição à parte pra "já registrado" — reaproveita
// 'status_invalido'. Registros clínicos são imutáveis (CLAUDE.md raiz);
// corrigir um resultado errado ficaria fora do escopo desta entrega (exigiria
// um fluxo de retificação, como `ModalRegistrarVacina.tsx`).
export function registrarResultadoMock(id: string, payload: RegistrarResultadoRequest): ResultadoTransicaoProcesso {
  const atual = processosMock.find((item) => item.id === id)
  if (!atual) return { ok: false, motivo: 'nao_encontrado' }
  if (atual.statusProcesso !== 'aguardando_resultado') return { ok: false, motivo: 'status_invalido' }

  const agora = new Date().toISOString()
  const atualizado: Processo = {
    ...atual,
    statusProcesso: 'com_resultado',
    resultadoLaboratorial: payload.resultadoLaboratorial,
    dataResultado: agora,
    desfechoAnimal: payload.desfechoAnimal,
    atualizadoEm: agora,
  }
  processosMock = processosMock.map((item) => (item.id === id ? atualizado : item))
  sincronizarVinculoNaOcorrencia(atualizado)
  return { ok: true, processo: structuredClone(atualizado) }
}

// com_resultado → concluido.
export function concluirProcessoMock(id: string): ResultadoTransicaoProcesso {
  const atual = processosMock.find((item) => item.id === id)
  if (!atual) return { ok: false, motivo: 'nao_encontrado' }
  if (atual.statusProcesso !== 'com_resultado') return { ok: false, motivo: 'status_invalido' }

  const agora = new Date().toISOString()
  const atualizado: Processo = { ...atual, statusProcesso: 'concluido', atualizadoEm: agora }
  processosMock = processosMock.map((item) => (item.id === id ? atualizado : item))
  sincronizarVinculoNaOcorrencia(atualizado)
  return { ok: true, processo: structuredClone(atualizado) }
}

export type ResultadoAnexoDocumento =
  | { ok: true; processo: Processo }
  | { ok: false; motivo: 'nao_encontrado' }

// `url: URL.createObjectURL` só é válida na aba atual — some ao recarregar a
// página, mesma simplificação já aceita em ocorrenciasMockStore.ts.
export function anexarDocumentoMock(
  id: string,
  payload: AnexarDocumentoRequest,
  autorNome: string,
): ResultadoAnexoDocumento {
  const atual = processosMock.find((item) => item.id === id)
  if (!atual) return { ok: false, motivo: 'nao_encontrado' }

  const agora = new Date().toISOString()
  const novoDocumento: DocumentoProcesso = {
    id: crypto.randomUUID(),
    nome: payload.arquivo.name,
    url: URL.createObjectURL(payload.arquivo),
    tipo: payload.tipo,
    tamanho: payload.arquivo.size,
    mimeType: payload.arquivo.type,
    criadoEm: agora,
    criadoPorNome: autorNome,
  }
  const atualizado: Processo = { ...atual, documentos: [...atual.documentos, novoDocumento], atualizadoEm: agora }
  processosMock = processosMock.map((item) => (item.id === id ? atualizado : item))
  return { ok: true, processo: structuredClone(atualizado) }
}

export type ResultadoVinculoPosterior =
  | { ok: true; processo: Processo }
  | {
      ok: false
      motivo: 'processo_nao_encontrado' | 'ocorrencia_nao_encontrada' | 'processo_ja_vinculado' | 'ocorrencia_ja_vinculada'
    }

// Emenda ao DER.md (2026-10-03): vínculo pode ser definido uma única vez
// depois da criação, de qualquer um dos dois lados, mas só quando NENHUM dos
// dois já tem vínculo — nunca para trocar um vínculo existente por outro.
// Função única serve as duas direções de UI (ProcessoDetalhe e
// OcorrenciaDetalhe chamam a mesma coisa, só mudando quem é "o lado que
// iniciou a ação").
export function vincularExistentesMock(processoId: string, ocorrenciaId: string): ResultadoVinculoPosterior {
  const processo = processosMock.find((item) => item.id === processoId)
  if (!processo) return { ok: false, motivo: 'processo_nao_encontrado' }
  if (processo.ocorrenciaVinculado) return { ok: false, motivo: 'processo_ja_vinculado' }

  const ocorrencia = buscarOcorrenciaMockPorId(ocorrenciaId, 'admin')
  if (!ocorrencia) return { ok: false, motivo: 'ocorrencia_nao_encontrada' }
  if (ocorrencia.processoVinculado) return { ok: false, motivo: 'ocorrencia_ja_vinculada' }

  const agora = new Date().toISOString()
  const atualizado: Processo = { ...processo, ocorrenciaVinculado: paraResumoVinculo(ocorrenciaId), atualizadoEm: agora }
  processosMock = processosMock.map((item) => (item.id === processoId ? atualizado : item))

  vincularProcessoNaOcorrenciaMock(ocorrenciaId, {
    id: processo.id,
    protocolo: processo.protocolo,
    statusProcesso: processo.statusProcesso,
    resultadoPendente: !processo.resultadoLaboratorial,
  })

  return { ok: true, processo: structuredClone(atualizado) }
}

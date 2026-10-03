import type { RoleKey } from '@/lib/nav'
import type { PaginaResponse } from '@/features/usuarios/types/usuarios.types'
import type {
  CriarOcorrenciaRequest,
  EncerrarOcorrenciaRequest,
  MovimentacaoOcorrencia,
  Ocorrencia,
  OcorrenciasFiltro,
  ProcessoVinculado,
} from '../types/ocorrencias.types'

// PROVISÓRIO: mock autoral da feature de ocorrências — o backend real
// (T25/T26) ainda não existe (com.siszoo.ocorrencias só tem pastas
// .gitkeep). Store local em memória, síncrono, sem service worker/rede: uma
// função por operação, sempre devolvendo cópias (nunca a referência viva do
// array) para não vazar mutação por baixo do cache do TanStack Query.

const OCORRENCIA_ABERTA_ID = 'h5000000-0000-0000-0000-000000000001'
const OCORRENCIA_SIGILOSA_ID = 'h5000000-0000-0000-0000-000000000002'
const OCORRENCIA_PROCESSO_PENDENTE_ID = 'h5000000-0000-0000-0000-000000000004'
const OCORRENCIA_ENCERRADA_ID = 'h5000000-0000-0000-0000-000000000005'
// Usada só pela T33 (frontend/src/features/processos/processosMockStore.ts,
// PROCESSO_SIGILOSO_ID) para exercitar RN4 (sigilo) num processo vinculado
// de ponta a ponta, sem tocar OCORRENCIA_SIGILOSA_ID — essa continua livre
// de processo porque SeletorOcorrencia.test.tsx depende dela estar
// selecionável.
const OCORRENCIA_SIGILOSA_COM_PROCESSO_ID = 'h5000000-0000-0000-0000-000000000006'

const AGENTE_PADRAO = 'Rafael Santos'
const VETERINARIA_PADRAO = 'Stéphanie Lima'

function seedOcorrenciasMock(): Ocorrencia[] {
  return [
    {
      id: OCORRENCIA_ABERTA_ID,
      protocolo: '089/2026',
      tipoOcorrencia: 'zoonose',
      statusOcorrencia: 'aberta',
      dataAbertura: '2026-05-20',
      horaAbertura: '10:32',
      endereco: 'Rua das Acácias, 145',
      bairro: 'Vila Esperança',
      pontoReferencia: 'Esquina com a Rua dos Ipês',
      descricao:
        'Munícipe relata cão de pelagem caramelo com sinais comportamentais incomuns: salivação excessiva, ataxia e hipersensibilidade a luz e ruídos. O animal não é de sua propriedade.',
      urgente: false,
      sigilosa: false,
      registradoPorNome: AGENTE_PADRAO,
      providenciaTomada: null,
      descricaoEncerramento: null,
      encerradaEm: null,
      processoVinculado: null,
      denunciante: {
        nome: 'Maria Souza Oliveira',
        cpf: '123.456.789-00',
        telefone: '(11) 9 8765-4321',
        email: 'maria.souza@email.com',
        cep: '13301-000',
        endereco: 'Rua dos Ipês, 220',
        bairroResidencial: 'Vila Esperança',
      },
      denunciado: null,
      movimentacoes: [
        {
          id: 'h6000000-0000-0000-0000-000000000001',
          tipoMovimentacao: 'registrada',
          data: '2026-05-20T10:32:00Z',
          descricao: 'Denúncia recebida via telefone (0800-CCZ-ITU).',
          usuarioNome: AGENTE_PADRAO,
        },
      ],
      anexos: [],
      criadoEm: '2026-05-20T10:32:00Z',
      atualizadoEm: '2026-05-20T10:32:00Z',
    },
    {
      id: OCORRENCIA_SIGILOSA_ID,
      protocolo: '090/2026',
      tipoOcorrencia: 'irregular',
      statusOcorrencia: 'aberta',
      dataAbertura: '2026-05-21',
      horaAbertura: '09:10',
      endereco: 'Rua das Palmeiras, 300',
      bairro: 'Jardim Bela Vista',
      pontoReferencia: null,
      descricao: 'Denúncia de maus-tratos a animal em quintal vizinho. Denunciante pediu sigilo.',
      urgente: false,
      sigilosa: true,
      registradoPorNome: AGENTE_PADRAO,
      providenciaTomada: null,
      descricaoEncerramento: null,
      encerradaEm: null,
      processoVinculado: null,
      // Dado "cru", como o backend guardaria — o mascaramento por perfil
      // acontece dinamicamente em `mascarar()`, não em dois registros fixos.
      denunciante: {
        nome: 'João Pereira Lima',
        cpf: '987.654.321-00',
        telefone: '(11) 9 1234-5678',
        email: 'joao.pereira@email.com',
        cep: '13302-100',
        endereco: 'Rua das Camélias, 88',
        bairroResidencial: 'Jardim Bela Vista',
      },
      denunciado: null,
      movimentacoes: [
        {
          id: 'h6000000-0000-0000-0000-000000000002',
          tipoMovimentacao: 'registrada',
          data: '2026-05-21T09:10:00Z',
          descricao: 'Denúncia registrada via formulário interno.',
          usuarioNome: AGENTE_PADRAO,
        },
      ],
      anexos: [],
      criadoEm: '2026-05-21T09:10:00Z',
      atualizadoEm: '2026-05-21T09:10:00Z',
    },
    {
      id: OCORRENCIA_PROCESSO_PENDENTE_ID,
      // Protocolo distinto do processo sanitário vinculado (linha 131) de
      // propósito — são sequências independentes, não pode coincidir.
      protocolo: '092/2026',
      tipoOcorrencia: 'zoonose',
      statusOcorrencia: 'em_atendimento',
      dataAbertura: '2026-05-18',
      horaAbertura: '08:00',
      endereco: 'Avenida Brasil, 900',
      bairro: 'Centro',
      pontoReferencia: 'Próximo ao mercado municipal',
      descricao: 'Cão errante com suspeita de raiva, amostra encaminhada para investigação laboratorial.',
      urgente: true,
      sigilosa: false,
      registradoPorNome: AGENTE_PADRAO,
      providenciaTomada: null,
      descricaoEncerramento: null,
      encerradaEm: null,
      processoVinculado: {
        id: 'h7000000-0000-0000-0000-000000000001',
        protocolo: '045/2026',
        statusProcesso: 'Aguardando resultado',
        resultadoPendente: true,
      },
      denunciante: {
        nome: 'Carla Mendes',
        cpf: '111.222.333-44',
        telefone: '(11) 9 2222-3333',
        email: 'carla.mendes@email.com',
        cep: '13300-000',
        endereco: 'Avenida Brasil, 850',
        bairroResidencial: 'Centro',
      },
      denunciado: null,
      movimentacoes: [
        {
          id: 'h6000000-0000-0000-0000-000000000004',
          tipoMovimentacao: 'processo_vinculado',
          data: '2026-05-18T14:32:00Z',
          descricao: 'Vinculação automática com investigação laboratorial — animal amostrado para teste de raiva.',
          usuarioNome: `Dra. ${VETERINARIA_PADRAO}`,
        },
        {
          id: 'h6000000-0000-0000-0000-000000000005',
          tipoMovimentacao: 'registrada',
          data: '2026-05-18T08:00:00Z',
          descricao: 'Denúncia recebida via telefone (0800-CCZ-ITU).',
          usuarioNome: AGENTE_PADRAO,
        },
      ],
      anexos: [],
      criadoEm: '2026-05-18T08:00:00Z',
      atualizadoEm: '2026-05-18T14:32:00Z',
    },
    {
      id: OCORRENCIA_ENCERRADA_ID,
      protocolo: '070/2026',
      tipoOcorrencia: 'agressivo',
      statusOcorrencia: 'encerrada',
      dataAbertura: '2026-05-10',
      horaAbertura: '11:00',
      endereco: 'Rua dos Girassóis, 40',
      bairro: 'Parque das Flores',
      pontoReferencia: null,
      descricao: 'Cão de grande porte solto, sem coleira, rondando escola municipal.',
      urgente: false,
      sigilosa: false,
      registradoPorNome: AGENTE_PADRAO,
      providenciaTomada: 'captura_remocao',
      descricaoEncerramento: 'Animal capturado e encaminhado ao CCZ para observação.',
      encerradaEm: '2026-05-12T16:00:00Z',
      processoVinculado: null,
      denunciante: {
        nome: 'Escola Municipal Parque das Flores',
        cpf: null,
        telefone: '(11) 4023-0000',
        email: null,
        cep: '13303-000',
        endereco: 'Rua dos Girassóis, 10',
        bairroResidencial: 'Parque das Flores',
      },
      denunciado: null,
      movimentacoes: [
        {
          id: 'h6000000-0000-0000-0000-000000000006',
          tipoMovimentacao: 'encerrada',
          data: '2026-05-12T16:00:00Z',
          descricao: 'Providência: Captura e remoção do animal.',
          usuarioNome: VETERINARIA_PADRAO,
        },
        {
          id: 'h6000000-0000-0000-0000-000000000007',
          tipoMovimentacao: 'equipe_despachada',
          data: '2026-05-11T09:00:00Z',
          descricao: 'Equipe de captura despachada ao local.',
          usuarioNome: 'Sistema',
        },
        {
          id: 'h6000000-0000-0000-0000-000000000008',
          tipoMovimentacao: 'registrada',
          data: '2026-05-10T11:00:00Z',
          descricao: 'Denúncia recebida presencialmente.',
          usuarioNome: AGENTE_PADRAO,
        },
      ],
      anexos: [
        {
          id: 'h8000000-0000-0000-0000-000000000001',
          nome: 'Foto do animal.jpg',
          url: '#',
          tamanho: 2_500_000,
          mimeType: 'image/jpeg',
          criadoEm: '2026-05-10T11:05:00Z',
        },
      ],
      criadoEm: '2026-05-10T11:00:00Z',
      atualizadoEm: '2026-05-12T16:00:00Z',
    },
    {
      id: OCORRENCIA_SIGILOSA_COM_PROCESSO_ID,
      protocolo: '095/2026',
      tipoOcorrencia: 'zoonose',
      statusOcorrencia: 'em_atendimento',
      dataAbertura: '2026-05-22',
      horaAbertura: '12:50',
      endereco: 'Rua das Camélias, 12',
      bairro: 'Jardim Bela Vista',
      pontoReferencia: null,
      descricao: 'Denunciante relata gato com sinais neurológicos após contato com animal silvestre. Pediu sigilo.',
      urgente: false,
      sigilosa: true,
      registradoPorNome: AGENTE_PADRAO,
      providenciaTomada: null,
      descricaoEncerramento: null,
      encerradaEm: null,
      processoVinculado: {
        id: 'p1000000-0000-0000-0000-000000000005',
        protocolo: '005/2026',
        statusProcesso: 'aguardando_resultado',
        resultadoPendente: true,
      },
      denunciante: {
        nome: 'Renata Costa Almeida',
        cpf: '222.333.444-55',
        telefone: '(11) 9 3333-4444',
        email: 'renata.almeida@email.com',
        cep: '13302-200',
        endereco: 'Rua das Camélias, 12',
        bairroResidencial: 'Jardim Bela Vista',
      },
      denunciado: null,
      movimentacoes: [
        {
          id: 'h6000000-0000-0000-0000-000000000009',
          tipoMovimentacao: 'processo_vinculado',
          data: '2026-05-22T13:00:00Z',
          descricao: 'Vinculação com investigação laboratorial — amostra coletada para febre maculosa.',
          usuarioNome: `Dra. ${VETERINARIA_PADRAO}`,
        },
        {
          id: 'h6000000-0000-0000-0000-000000000010',
          tipoMovimentacao: 'registrada',
          data: '2026-05-22T12:50:00Z',
          descricao: 'Denúncia recebida via formulário interno.',
          usuarioNome: AGENTE_PADRAO,
        },
      ],
      anexos: [],
      criadoEm: '2026-05-22T12:50:00Z',
      atualizadoEm: '2026-05-22T13:00:00Z',
    },
  ]
}

let ocorrenciasMock: Ocorrencia[] = seedOcorrenciasMock()

export function resetOcorrenciasMock() {
  ocorrenciasMock = seedOcorrenciasMock()
}

function paginar<T>(itens: T[], pagina: number, tamanho: number): PaginaResponse<T> {
  const totalItens = itens.length
  const totalPaginas = Math.max(Math.ceil(totalItens / tamanho), 1)
  const inicio = pagina * tamanho
  return { itens: itens.slice(inicio, inicio + tamanho), pagina, tamanho, totalItens, totalPaginas }
}

// Mascara ANTES de qualquer filtro ser aplicado (ver listarOcorrenciasMock)
// — nunca o contrário. Se a busca livre comparasse contra o dado bruto e só
// depois mascarasse a coluna exibida, uma busca pelo nome real do
// denunciante de uma ocorrência sigilosa ainda faria o registro aparecer no
// resultado, confirmando a identidade por um canal lateral mesmo com
// "Sigiloso" na tela. A mesma regra vale para o backend real quando existir.
function mascarar(ocorrencia: Ocorrencia, roleKey: RoleKey): Ocorrencia {
  if (!ocorrencia.sigilosa || roleKey === 'admin' || !ocorrencia.denunciante) {
    return structuredClone(ocorrencia)
  }
  return structuredClone({
    ...ocorrencia,
    denunciante: {
      nome: null,
      cpf: null,
      telefone: null,
      email: null,
      cep: null,
      endereco: null,
      bairroResidencial: null,
    },
  })
}

export function listarOcorrenciasMock(filtro: OcorrenciasFiltro, roleKey: RoleKey): PaginaResponse<Ocorrencia> {
  const mascaradas = ocorrenciasMock.map((item) => mascarar(item, roleKey))
  const q = filtro.q?.trim().toLowerCase()
  const filtradas = mascaradas.filter((item) => {
    const combinaTipo = !filtro.tipoOcorrencia || item.tipoOcorrencia === filtro.tipoOcorrencia
    const combinaStatus = !filtro.statusOcorrencia || item.statusOcorrencia === filtro.statusOcorrencia
    const combinaBusca =
      !q ||
      item.protocolo.toLowerCase().includes(q) ||
      item.bairro.toLowerCase().includes(q) ||
      (item.denunciante?.nome ?? '').toLowerCase().includes(q)
    return combinaTipo && combinaStatus && combinaBusca
  })
  return paginar(filtradas, filtro.pagina, filtro.tamanho)
}

export function buscarOcorrenciaMockPorId(id: string, roleKey: RoleKey): Ocorrencia | null {
  const encontrada = ocorrenciasMock.find((item) => item.id === id)
  return encontrada ? mascarar(encontrada, roleKey) : null
}

// Sequência anual client-side só para o mock — sem lock de concorrência real
// (o DER exige lock no backend real). Acima de 999 ocorrências no mesmo ano,
// o protocolo deixa de ter 3 dígitos exatos (ex.: "1000/2026") em vez de
// travar; o backend real precisa de uma constraint própria para esse caso.
function gerarProximoProtocolo(ocorrencias: Ocorrencia[]): string {
  const sufixo = `/${new Date().getFullYear()}`
  const maiorSequencia = ocorrencias
    .filter((item) => item.protocolo.endsWith(sufixo))
    .reduce((maior, item) => Math.max(maior, Number(item.protocolo.split('/')[0])), 0)
  return `${String(maiorSequencia + 1).padStart(3, '0')}${sufixo}`
}

export function criarOcorrenciaMock(payload: CriarOcorrenciaRequest, autorNome: string): Ocorrencia {
  const agora = new Date().toISOString()
  const nova: Ocorrencia = {
    id: crypto.randomUUID(),
    protocolo: gerarProximoProtocolo(ocorrenciasMock),
    tipoOcorrencia: payload.tipoOcorrencia,
    statusOcorrencia: 'aberta',
    dataAbertura: payload.dataAbertura,
    horaAbertura: payload.horaAbertura ?? null,
    endereco: payload.endereco,
    bairro: payload.bairro,
    pontoReferencia: payload.pontoReferencia ?? null,
    descricao: payload.descricao,
    urgente: false,
    sigilosa: payload.sigilosa,
    registradoPorNome: autorNome,
    providenciaTomada: null,
    descricaoEncerramento: null,
    encerradaEm: null,
    processoVinculado: null,
    denunciante: {
      nome: payload.denunciante.nome ?? null,
      cpf: payload.denunciante.cpf ?? null,
      telefone: payload.denunciante.telefone ?? null,
      email: payload.denunciante.email ?? null,
      cep: payload.denunciante.cep ?? null,
      endereco: payload.denunciante.endereco ?? null,
      bairroResidencial: payload.denunciante.bairroResidencial ?? null,
    },
    denunciado: payload.denunciado
      ? {
          nome: payload.denunciado.nome ?? null,
          cpf: payload.denunciado.cpf ?? null,
          telefone: payload.denunciado.telefone ?? null,
          endereco: payload.denunciado.endereco ?? null,
          observacoes: payload.denunciado.observacoes ?? null,
        }
      : null,
    movimentacoes: [
      {
        id: crypto.randomUUID(),
        tipoMovimentacao: 'registrada',
        data: agora,
        descricao: null,
        usuarioNome: autorNome,
      },
    ],
    // `URL.createObjectURL` só é válida na aba atual, enquanto ela estiver
    // aberta — some ao recarregar a página, junto com o resto do mock.
    anexos: payload.anexos.map((arquivo) => ({
      id: crypto.randomUUID(),
      nome: arquivo.name,
      url: URL.createObjectURL(arquivo),
      tamanho: arquivo.size,
      mimeType: arquivo.type,
      criadoEm: agora,
    })),
    criadoEm: agora,
    atualizadoEm: agora,
  }
  ocorrenciasMock = [...ocorrenciasMock, nova]
  return structuredClone(nova)
}

export type ResultadoEncerramento =
  | { ok: true; ocorrencia: Ocorrencia }
  | { ok: false; motivo: 'nao_encontrada' | 'processo_pendente' }

export function encerrarOcorrenciaMock(
  id: string,
  payload: EncerrarOcorrenciaRequest,
  autorNome: string,
): ResultadoEncerramento {
  const atual = ocorrenciasMock.find((item) => item.id === id)
  if (!atual) return { ok: false, motivo: 'nao_encontrada' }
  if (atual.processoVinculado?.resultadoPendente) return { ok: false, motivo: 'processo_pendente' }

  const agora = new Date().toISOString()
  const novaMovimentacao: MovimentacaoOcorrencia = {
    id: crypto.randomUUID(),
    tipoMovimentacao: 'encerrada',
    data: agora,
    descricao: null,
    usuarioNome: autorNome,
  }
  const atualizada: Ocorrencia = {
    ...atual,
    statusOcorrencia: 'encerrada',
    providenciaTomada: payload.providenciaTomada,
    descricaoEncerramento: payload.descricaoEncerramento ?? null,
    encerradaEm: agora,
    movimentacoes: [...atual.movimentacoes, novaMovimentacao],
    atualizadoEm: agora,
  }
  // Substitui o item via .map() — nunca muta `atual` in place, senão o
  // cache do TanStack Query de uma leitura anterior mudaria "por baixo".
  ocorrenciasMock = ocorrenciasMock.map((item) => (item.id === id ? atualizada : item))
  return { ok: true, ocorrencia: structuredClone(atualizada) }
}

// Único destino possível hoje é 'aberta' → 'em_atendimento' — não há tipo de
// movimentação dedicado no catálogo do DER.md §3.4 para essa transição, só
// os já existentes (registrada/equipe_despachada/processo_vinculado/
// aguardando_resultado/encerrada/nota_interna), então usa 'nota_interna'
// (o catch-all do catálogo) com uma descrição explícita, em vez de inventar
// um valor fora do DER.
export function iniciarAtendimentoMock(id: string, autorNome: string): Ocorrencia | null {
  const atual = ocorrenciasMock.find((item) => item.id === id)
  if (!atual || atual.statusOcorrencia !== 'aberta') return null

  const agora = new Date().toISOString()
  const novaMovimentacao: MovimentacaoOcorrencia = {
    id: crypto.randomUUID(),
    tipoMovimentacao: 'nota_interna',
    data: agora,
    descricao: 'Ocorrência movida para "Em atendimento".',
    usuarioNome: autorNome,
  }
  const atualizada: Ocorrencia = {
    ...atual,
    statusOcorrencia: 'em_atendimento',
    movimentacoes: [...atual.movimentacoes, novaMovimentacao],
    atualizadoEm: agora,
  }
  ocorrenciasMock = ocorrenciasMock.map((item) => (item.id === id ? atualizada : item))
  return structuredClone(atualizada)
}

// Chamada por processosMockStore.ts::criarProcessoMock quando um processo é
// criado com vínculo — reflexo bidirecional exigido pela T32 (o DER modela
// `ocorrencia.processo_sanitario_id`/`processoVinculado` como consequência da
// criação do processo, não o contrário). Não é refatoração da feature de
// ocorrências, é uma adição pontual: sem essa função, `encerrarOcorrenciaMock`
// nunca veria o processo pendente (regra 13) para uma ocorrência vinculada
// depois da T32.
export function vincularProcessoNaOcorrenciaMock(ocorrenciaId: string, processoVinculado: ProcessoVinculado): void {
  ocorrenciasMock = ocorrenciasMock.map((item) => (item.id === ocorrenciaId ? { ...item, processoVinculado } : item))
}

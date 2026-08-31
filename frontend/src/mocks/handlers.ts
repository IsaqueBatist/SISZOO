import { http, HttpResponse } from 'msw'
import type { Animal, Baia, CatalogosAnimal } from '../features/animais/animais.types'
import type { LoginRequest, LoginResponse } from '../features/auth/auth.types'
import { API_BASE_URL } from '../lib/env'
import type { CriarUsuarioRequest, UsuarioListItem } from '../features/usuarios/usuarios.types'
import type { PreferenciaUsuario } from '../features/configuracoes/configuracoes.types'

// Usado só pelos testes automatizados (mocks/server.ts) — o dev browser
// (mocks/browser.ts) não intercepta mais login/senha/usuários, que já existem
// de verdade no backend (módulo usuarios). Mantido aqui para os componentes
// não dependerem de um Postgres/Spring de pé para rodar `npm run test`.
export const CREDENCIAIS_VALIDAS: LoginRequest = {
  email: 'stephanie.lima@itu.sp.gov.br',
  senha: 'senha-de-exemplo',
}

const LOGIN_RESPONSE: LoginResponse = {
  token: 'token-jwt-mock',
  usuario: {
    id: 'a1b2c3d4-0000-0000-0000-000000000001',
    nome: 'Stéphanie',
    sobrenome: 'Lima',
    email: CREDENCIAIS_VALIDAS.email,
    cargos: ['Veterinário'],
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  },
}

// `senhaInicial` é um detalhe só deste mock (permite simular login com um
// usuário recém-criado nos testes) e nunca é devolvido pela API simulada.
interface UsuarioMockInterno extends UsuarioListItem {
  senhaInicial: string
}

function seedUsuariosMock(): UsuarioMockInterno[] {
  return [
    {
      id: 'a1b2c3d4-0000-0000-0000-000000000001',
      nome: 'Stéphanie',
      sobrenome: 'Lima',
      email: 'stephanie.lima@itu.sp.gov.br',
      cargos: ['Veterinário'],
      crmv: 'CRMV-SP 01234',
      senhaAlteradaEm: '2026-01-10T12:00:00Z',
      ativo: true,
      ultimoAcesso: '2026-05-20T14:32:00Z',
      criadoEm: '2024-03-15T09:00:00Z',
      senhaInicial: CREDENCIAIS_VALIDAS.senha,
    },
    {
      id: 'a1b2c3d4-0000-0000-0000-000000000002',
      nome: 'Paulo',
      sobrenome: 'Henriques',
      email: 'paulo.henriques@itu.sp.gov.br',
      cargos: ['Administrador'],
      crmv: null,
      senhaAlteradaEm: '2024-03-15T09:00:00Z',
      ativo: true,
      ultimoAcesso: '2026-05-20T14:00:00Z',
      criadoEm: '2024-03-15T09:00:00Z',
      senhaInicial: 'Itu@2026!',
    },
    {
      id: 'a1b2c3d4-0000-0000-0000-000000000003',
      nome: 'Carlos',
      sobrenome: 'Martins',
      email: 'carlos.martins@itu.sp.gov.br',
      cargos: ['Veterinário'],
      crmv: 'CRMV-SP 05678',
      senhaAlteradaEm: '2024-05-10T09:00:00Z',
      ativo: true,
      ultimoAcesso: '2026-05-19T17:02:00Z',
      criadoEm: '2024-05-10T09:00:00Z',
      senhaInicial: 'Itu@2026!',
    },
    {
      id: 'a1b2c3d4-0000-0000-0000-000000000004',
      nome: 'Rafael',
      sobrenome: 'Santos',
      email: 'rafael.santos@itu.sp.gov.br',
      cargos: ['Agente Sanitário'],
      crmv: null,
      senhaAlteradaEm: '2024-11-03T09:00:00Z',
      ativo: true,
      ultimoAcesso: '2026-05-20T12:55:00Z',
      criadoEm: '2024-11-03T09:00:00Z',
      senhaInicial: 'Itu@2026!',
    },
    {
      id: 'a1b2c3d4-0000-0000-0000-000000000005',
      nome: 'Marcos',
      sobrenome: 'Oliveira',
      email: 'marcos.oliveira@itu.sp.gov.br',
      cargos: ['Agente Sanitário'],
      crmv: null,
      senhaAlteradaEm: '2024-12-20T09:00:00Z',
      ativo: true,
      ultimoAcesso: '2026-05-20T11:08:00Z',
      criadoEm: '2024-12-20T09:00:00Z',
      senhaInicial: 'Itu@2026!',
    },
    {
      id: 'a1b2c3d4-0000-0000-0000-000000000006',
      nome: 'Joana',
      sobrenome: 'Pires',
      email: 'joana.pires@itu.sp.gov.br',
      cargos: ['Veterinário'],
      crmv: 'CRMV-SP 09999',
      senhaAlteradaEm: '2024-09-18T09:00:00Z',
      ativo: false,
      ultimoAcesso: '2026-02-12T11:00:00Z',
      criadoEm: '2024-09-18T09:00:00Z',
      senhaInicial: 'Itu@2026!',
    },
  ]
}

let usuariosMock: UsuarioMockInterno[] = seedUsuariosMock()

export function resetUsuariosMock() {
  usuariosMock = seedUsuariosMock()
}

// GET/PATCH /usuarios/me e /usuarios/me/preferencias não recebem id — no
// backend real o usuário vem do token JWT. Aqui sempre representam o usuário
// logado nos testes (usuariosMock[0]).
function seedPreferenciasMock(): PreferenciaUsuario {
  return {
    tema: 'LIGHT',
    densidade: 'NORMAL',
    notifAlertasCriticos: true,
    notifVacinaVencendo: true,
    notifSuperlotacao: true,
    notifResultadoLab: true,
    notifEmailDiario: false,
  }
}

let preferenciasMock: PreferenciaUsuario = seedPreferenciasMock()

export function resetPreferenciasMock() {
  preferenciasMock = seedPreferenciasMock()
}

function paraUsuarioPublico({ senhaInicial: _senhaInicial, ...usuario }: UsuarioMockInterno): UsuarioListItem {
  return usuario
}

// Cobre os 7 status reais do catálogo (incluindo os dois tipos de óbito e
// "transferido", que não têm badge dedicado no design system) e inclui
// espécies sem classe de badge própria (quiróptero, pnh) para exercitar o
// fallback neutro nos testes.
function seedAnimaisMock(): Animal[] {
  return [
    {
      id: 'b2c3d4e5-0000-0000-0000-000000000001',
      nome: 'Rex',
      especieCodigo: 'canino',
      especieNome: 'Canino',
      sexo: 'macho',
      raca: 'SRD',
      coloracao: 'Caramelo',
      pelagem: 'curta',
      porte: 'grande',
      pesoKg: 28.5,
      idadeAprox: '3 anos',
      dataNascimentoAprox: null,
      microchip: '985121234567890',
      esterilizado: true,
      dataEsterilizacao: '2023-06-10',
      statusCodigo: 'disponivel_adocao',
      statusNome: 'Disponível',
      motivoEntradaCodigo: 'resgate',
      motivoEntradaNome: 'Resgate',
      dataEntrada: '2024-03-15T09:00:00Z',
      baiaId: 'c3d4e5f6-0000-0000-0000-000000000001',
      baiaNome: 'Baia 3',
      tipoBaiaNome: 'Canil',
      fichaCompleta: true,
      fotoUrl: null,
      observacoes: null,
      criadoPorId: 'a1b2c3d4-0000-0000-0000-000000000001',
      criadoPorNome: 'Stéphanie Lima',
      criadoEm: '2024-03-15T09:00:00Z',
      atualizadoEm: '2024-03-15T09:00:00Z',
    },
    {
      id: 'b2c3d4e5-0000-0000-0000-000000000002',
      nome: 'Luna',
      especieCodigo: 'felino',
      especieNome: 'Felino',
      sexo: 'femea',
      raca: 'SRD',
      coloracao: 'Cinza',
      pelagem: 'curta',
      porte: 'pequeno',
      pesoKg: 3.8,
      idadeAprox: '1 ano',
      dataNascimentoAprox: null,
      microchip: '985121234698732',
      esterilizado: true,
      dataEsterilizacao: '2024-09-01',
      statusCodigo: 'em_quarentena',
      statusNome: 'Em quarentena',
      motivoEntradaCodigo: 'resgate',
      motivoEntradaNome: 'Resgate',
      dataEntrada: '2024-08-12T10:00:00Z',
      baiaId: 'c3d4e5f6-0000-0000-0000-000000000002',
      baiaNome: 'Gatil A',
      tipoBaiaNome: 'Gatil',
      fichaCompleta: true,
      fotoUrl: null,
      observacoes: null,
      criadoPorId: 'a1b2c3d4-0000-0000-0000-000000000001',
      criadoPorNome: 'Stéphanie Lima',
      criadoEm: '2024-08-12T10:00:00Z',
      atualizadoEm: '2024-08-12T10:00:00Z',
    },
    {
      id: 'b2c3d4e5-0000-0000-0000-000000000003',
      nome: 'Bidu',
      especieCodigo: 'canino',
      especieNome: 'Canino',
      sexo: 'macho',
      raca: 'SRD',
      coloracao: 'Preto',
      pelagem: 'curta',
      porte: 'medio',
      pesoKg: 15,
      idadeAprox: '4 anos',
      dataNascimentoAprox: null,
      microchip: '985121235012984',
      esterilizado: true,
      dataEsterilizacao: '2025-02-20',
      statusCodigo: 'em_tratamento',
      statusNome: 'Em tratamento',
      motivoEntradaCodigo: 'resgate',
      motivoEntradaNome: 'Resgate',
      dataEntrada: '2025-02-22T09:00:00Z',
      baiaId: 'c3d4e5f6-0000-0000-0000-000000000003',
      baiaNome: 'Baia 6',
      tipoBaiaNome: 'Canil',
      fichaCompleta: true,
      fotoUrl: null,
      observacoes: null,
      criadoPorId: 'a1b2c3d4-0000-0000-0000-000000000001',
      criadoPorNome: 'Stéphanie Lima',
      criadoEm: '2025-02-22T09:00:00Z',
      atualizadoEm: '2025-02-22T09:00:00Z',
    },
    {
      id: 'b2c3d4e5-0000-0000-0000-000000000004',
      nome: 'Mia',
      especieCodigo: 'felino',
      especieNome: 'Felino',
      sexo: 'femea',
      raca: 'SRD',
      coloracao: 'Rajada',
      pelagem: 'curta',
      porte: 'pequeno',
      pesoKg: 4.2,
      idadeAprox: '2 anos',
      dataNascimentoAprox: null,
      microchip: '985121235201554',
      esterilizado: true,
      dataEsterilizacao: '2025-01-10',
      statusCodigo: 'adotado',
      statusNome: 'Adotado',
      motivoEntradaCodigo: 'resgate',
      motivoEntradaNome: 'Resgate',
      dataEntrada: '2025-04-02T09:00:00Z',
      baiaId: null,
      baiaNome: null,
      tipoBaiaNome: null,
      fichaCompleta: true,
      fotoUrl: null,
      observacoes: null,
      criadoPorId: 'a1b2c3d4-0000-0000-0000-000000000001',
      criadoPorNome: 'Stéphanie Lima',
      criadoEm: '2025-04-02T09:00:00Z',
      atualizadoEm: '2025-04-02T09:00:00Z',
    },
    {
      id: 'b2c3d4e5-0000-0000-0000-000000000005',
      nome: 'Anita',
      especieCodigo: 'canino',
      especieNome: 'Canino',
      sexo: 'femea',
      raca: 'SRD',
      coloracao: 'Branca',
      pelagem: 'longa',
      porte: 'grande',
      pesoKg: 24,
      idadeAprox: '6 anos',
      dataNascimentoAprox: null,
      microchip: '985121236176390',
      esterilizado: true,
      dataEsterilizacao: '2020-05-18',
      statusCodigo: 'obito_natural',
      statusNome: 'Óbito natural',
      motivoEntradaCodigo: 'resgate',
      motivoEntradaNome: 'Resgate',
      dataEntrada: '2025-05-18T09:00:00Z',
      baiaId: null,
      baiaNome: null,
      tipoBaiaNome: null,
      fichaCompleta: true,
      fotoUrl: null,
      observacoes: null,
      criadoPorId: 'a1b2c3d4-0000-0000-0000-000000000001',
      criadoPorNome: 'Stéphanie Lima',
      criadoEm: '2025-05-18T09:00:00Z',
      atualizadoEm: '2025-05-18T09:00:00Z',
    },
    {
      id: 'b2c3d4e5-0000-0000-0000-000000000006',
      nome: 'Thor',
      especieCodigo: 'canino',
      especieNome: 'Canino',
      sexo: 'macho',
      raca: 'SRD',
      coloracao: 'Caramelo',
      pelagem: 'curta',
      porte: 'grande',
      pesoKg: 30,
      idadeAprox: '8 anos',
      dataNascimentoAprox: null,
      microchip: '985121234712634',
      esterilizado: true,
      dataEsterilizacao: '2019-09-21',
      statusCodigo: 'obito_eutanasia',
      statusNome: 'Óbito eutanásia',
      motivoEntradaCodigo: 'resgate',
      motivoEntradaNome: 'Resgate',
      dataEntrada: '2025-09-21T09:00:00Z',
      baiaId: null,
      baiaNome: null,
      tipoBaiaNome: null,
      fichaCompleta: true,
      fotoUrl: null,
      observacoes: null,
      criadoPorId: 'a1b2c3d4-0000-0000-0000-000000000001',
      criadoPorNome: 'Stéphanie Lima',
      criadoEm: '2025-09-21T09:00:00Z',
      atualizadoEm: '2025-09-21T09:00:00Z',
    },
    {
      id: 'b2c3d4e5-0000-0000-0000-000000000007',
      nome: 'Nina',
      especieCodigo: 'canino',
      especieNome: 'Canino',
      sexo: 'femea',
      raca: 'SRD',
      coloracao: 'Amarela',
      pelagem: 'curta',
      porte: 'medio',
      pesoKg: 16,
      idadeAprox: '2 anos',
      dataNascimentoAprox: null,
      microchip: null,
      esterilizado: true,
      dataEsterilizacao: '2025-06-23',
      statusCodigo: 'transferido',
      statusNome: 'Transferido',
      motivoEntradaCodigo: 'resgate',
      motivoEntradaNome: 'Resgate',
      dataEntrada: '2025-06-23T09:00:00Z',
      baiaId: null,
      baiaNome: null,
      tipoBaiaNome: null,
      fichaCompleta: true,
      fotoUrl: null,
      observacoes: null,
      criadoPorId: 'a1b2c3d4-0000-0000-0000-000000000001',
      criadoPorNome: 'Stéphanie Lima',
      criadoEm: '2025-06-23T09:00:00Z',
      atualizadoEm: '2025-06-23T09:00:00Z',
    },
    {
      id: 'b2c3d4e5-0000-0000-0000-000000000008',
      nome: 'Bob',
      especieCodigo: 'canino',
      especieNome: 'Canino',
      sexo: 'macho',
      raca: 'SRD',
      coloracao: 'Preto e branco',
      pelagem: 'curta',
      porte: 'grande',
      pesoKg: 26,
      idadeAprox: '3 anos',
      dataNascimentoAprox: null,
      microchip: '985121235298011',
      esterilizado: true,
      dataEsterilizacao: '2025-05-11',
      statusCodigo: 'disponivel_adocao',
      statusNome: 'Disponível',
      motivoEntradaCodigo: 'resgate',
      motivoEntradaNome: 'Resgate',
      dataEntrada: '2025-05-11T09:00:00Z',
      baiaId: 'c3d4e5f6-0000-0000-0000-000000000004',
      baiaNome: 'Baia 7',
      tipoBaiaNome: 'Canil',
      fichaCompleta: true,
      fotoUrl: null,
      observacoes: null,
      criadoPorId: 'a1b2c3d4-0000-0000-0000-000000000001',
      criadoPorNome: 'Stéphanie Lima',
      criadoEm: '2025-05-11T09:00:00Z',
      atualizadoEm: '2025-05-11T09:00:00Z',
    },
    {
      id: 'b2c3d4e5-0000-0000-0000-000000000009',
      nome: 'Frida',
      especieCodigo: 'quiroptero',
      especieNome: 'Quiróptero',
      sexo: 'femea',
      raca: null,
      coloracao: 'Marrom',
      pelagem: null,
      porte: 'pequeno',
      pesoKg: 0.05,
      idadeAprox: null,
      dataNascimentoAprox: null,
      microchip: null,
      esterilizado: false,
      dataEsterilizacao: null,
      statusCodigo: 'em_tratamento',
      statusNome: 'Em tratamento',
      motivoEntradaCodigo: 'entrega_voluntaria',
      motivoEntradaNome: 'Entrega voluntária',
      dataEntrada: '2025-01-08T09:00:00Z',
      baiaId: null,
      baiaNome: null,
      tipoBaiaNome: null,
      fichaCompleta: false,
      fotoUrl: null,
      observacoes: null,
      criadoPorId: 'a1b2c3d4-0000-0000-0000-000000000001',
      criadoPorNome: 'Stéphanie Lima',
      criadoEm: '2025-01-08T09:00:00Z',
      atualizadoEm: '2025-01-08T09:00:00Z',
    },
    {
      id: 'b2c3d4e5-0000-0000-0000-000000000010',
      nome: 'Kiko',
      especieCodigo: 'pnh',
      especieNome: 'Primata não-humano',
      sexo: 'macho',
      raca: null,
      coloracao: 'Marrom',
      pelagem: null,
      porte: 'medio',
      pesoKg: 5.5,
      idadeAprox: null,
      dataNascimentoAprox: null,
      microchip: null,
      esterilizado: false,
      dataEsterilizacao: null,
      statusCodigo: 'disponivel_adocao',
      statusNome: 'Disponível',
      motivoEntradaCodigo: 'apreensao',
      motivoEntradaNome: 'Apreensão',
      dataEntrada: '2026-02-17T09:00:00Z',
      baiaId: null,
      baiaNome: null,
      tipoBaiaNome: null,
      fichaCompleta: false,
      fotoUrl: null,
      observacoes: null,
      criadoPorId: 'a1b2c3d4-0000-0000-0000-000000000001',
      criadoPorNome: 'Stéphanie Lima',
      criadoEm: '2026-02-17T09:00:00Z',
      atualizadoEm: '2026-02-17T09:00:00Z',
    },
  ]
}

// Animais adicionais só para garantir 2 páginas reais (tamanho padrão = 20),
// permitindo testar paginação de servidor de ponta a ponta na UI.
function criarAnimalFiller(indice: number): Animal {
  return {
    id: `b2c3d4e5-0000-0000-0000-0000000000${indice}`,
    nome: `Animal Filler ${indice}`,
    especieCodigo: 'canino',
    especieNome: 'Canino',
    sexo: 'macho',
    raca: 'SRD',
    coloracao: 'Caramelo',
    pelagem: 'curta',
    porte: 'medio',
    pesoKg: 14,
    idadeAprox: '1 ano',
    dataNascimentoAprox: null,
    microchip: null,
    esterilizado: true,
    dataEsterilizacao: null,
    statusCodigo: 'disponivel_adocao',
    statusNome: 'Disponível',
    motivoEntradaCodigo: 'resgate',
    motivoEntradaNome: 'Resgate',
    dataEntrada: '2026-01-01T09:00:00Z',
    baiaId: null,
    baiaNome: null,
    tipoBaiaNome: null,
    fichaCompleta: false,
    fotoUrl: null,
    observacoes: null,
    criadoPorId: 'a1b2c3d4-0000-0000-0000-000000000001',
    criadoPorNome: 'Stéphanie Lima',
    criadoEm: '2026-01-01T09:00:00Z',
    atualizadoEm: '2026-01-01T09:00:00Z',
  }
}

const animaisMock: Animal[] = [
  ...seedAnimaisMock(),
  ...Array.from({ length: 12 }, (_, indice) => criarAnimalFiller(indice + 11)),
]

const CATALOGOS_ANIMAIS_MOCK: CatalogosAnimal = {
  especies: [
    { codigo: 'canino', nome: 'Canino' },
    { codigo: 'felino', nome: 'Felino' },
    { codigo: 'quiroptero', nome: 'Quiróptero' },
    { codigo: 'pnh', nome: 'Primata não-humano' },
  ],
  status: [
    { codigo: 'disponivel_adocao', nome: 'Disponível' },
    { codigo: 'em_tratamento', nome: 'Em tratamento' },
    { codigo: 'em_quarentena', nome: 'Em quarentena' },
    { codigo: 'adotado', nome: 'Adotado' },
    { codigo: 'obito_natural', nome: 'Óbito natural' },
    { codigo: 'obito_eutanasia', nome: 'Óbito eutanásia' },
    { codigo: 'transferido', nome: 'Transferido' },
  ],
  motivosEntrada: [
    { codigo: 'resgate', nome: 'Resgate' },
    { codigo: 'entrega_voluntaria', nome: 'Entrega voluntária' },
    { codigo: 'apreensao', nome: 'Apreensão' },
  ],
  tiposBaia: [
    { codigo: 'canil', nome: 'Canil' },
    { codigo: 'gatil', nome: 'Gatil' },
  ],
}

// IDs alinhados aos baiaId/baiaNome já usados em seedAnimaisMock (Rex, Luna,
// Bidu, Bob), mais uma baia inativa para exercitar o filtro `ativa=true`.
const BAIAS_MOCK: Baia[] = [
  {
    id: 'c3d4e5f6-0000-0000-0000-000000000001',
    nome: 'Baia 3',
    tipoBaiaCodigo: 'canil',
    tipoBaiaNome: 'Canil',
    capacidade: 2,
    finalidade: null,
    ativa: true,
    observacoes: null,
    ocupacaoAtual: 1,
    superlotada: false,
  },
  {
    id: 'c3d4e5f6-0000-0000-0000-000000000002',
    nome: 'Gatil A',
    tipoBaiaCodigo: 'gatil',
    tipoBaiaNome: 'Gatil',
    capacidade: 4,
    finalidade: null,
    ativa: true,
    observacoes: null,
    ocupacaoAtual: 1,
    superlotada: false,
  },
  {
    id: 'c3d4e5f6-0000-0000-0000-000000000003',
    nome: 'Baia 6',
    tipoBaiaCodigo: 'canil',
    tipoBaiaNome: 'Canil',
    capacidade: 2,
    finalidade: null,
    ativa: true,
    observacoes: null,
    ocupacaoAtual: 1,
    superlotada: false,
  },
  {
    id: 'c3d4e5f6-0000-0000-0000-000000000004',
    nome: 'Baia 7',
    tipoBaiaCodigo: 'canil',
    tipoBaiaNome: 'Canil',
    capacidade: 2,
    finalidade: null,
    ativa: true,
    observacoes: null,
    ocupacaoAtual: 1,
    superlotada: false,
  },
  {
    id: 'c3d4e5f6-0000-0000-0000-000000000005',
    nome: 'Baia Interditada',
    tipoBaiaCodigo: 'canil',
    tipoBaiaNome: 'Canil',
    capacidade: 2,
    finalidade: 'Reforma',
    ativa: false,
    observacoes: null,
    ocupacaoAtual: 0,
    superlotada: false,
  },
]

export const handlers = [
  http.get(`${API_BASE_URL}/health`, () => {
    return HttpResponse.json({ status: 'ok' })
  }),

  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as LoginRequest

    if (body.email === CREDENCIAIS_VALIDAS.email && body.senha === CREDENCIAIS_VALIDAS.senha) {
      return HttpResponse.json(LOGIN_RESPONSE)
    }

    const usuarioMock = usuariosMock.find(
      (usuario) => usuario.email === body.email && usuario.senhaInicial === body.senha && usuario.ativo,
    )
    if (usuarioMock) {
      const resposta: LoginResponse = {
        token: `token-jwt-mock-${usuarioMock.id}`,
        usuario: {
          id: usuarioMock.id,
          nome: usuarioMock.nome,
          sobrenome: usuarioMock.sobrenome,
          email: usuarioMock.email,
          cargos: usuarioMock.cargos,
          senhaAlteradaEm: usuarioMock.senhaAlteradaEm,
        },
      }
      return HttpResponse.json(resposta)
    }

    return HttpResponse.json({ mensagem: 'Credenciais inválidas' }, { status: 401 })
  }),

  http.post(`${API_BASE_URL}/auth/senha`, async () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${API_BASE_URL}/usuarios`, () => {
    const itens = usuariosMock.map(paraUsuarioPublico)
    return HttpResponse.json({
      itens,
      pagina: 0,
      tamanho: itens.length,
      totalItens: itens.length,
      totalPaginas: 1,
    })
  }),

  http.post(`${API_BASE_URL}/usuarios`, async ({ request }) => {
    const body = (await request.json()) as CriarUsuarioRequest

    const novoUsuario: UsuarioMockInterno = {
      id: crypto.randomUUID(),
      nome: body.nome,
      sobrenome: body.sobrenome,
      email: body.email,
      cargos: [body.cargo],
      crmv: body.crmv ?? null,
      senhaAlteradaEm: null,
      ativo: true,
      ultimoAcesso: null,
      criadoEm: new Date().toISOString(),
      senhaInicial: body.senhaInicial,
    }

    usuariosMock = [...usuariosMock, novoUsuario]
    return HttpResponse.json(paraUsuarioPublico(novoUsuario), { status: 201 })
  }),

  http.patch(`${API_BASE_URL}/usuarios/:id/status`, async ({ params, request }) => {
    const { ativo } = (await request.json()) as { ativo: boolean }
    const usuario = usuariosMock.find((item) => item.id === params.id)

    if (!usuario) {
      return HttpResponse.json({ mensagem: 'Usuário não encontrado' }, { status: 404 })
    }

    usuario.ativo = ativo
    return HttpResponse.json(paraUsuarioPublico(usuario))
  }),

  http.get(`${API_BASE_URL}/usuarios/me`, () => {
    return HttpResponse.json(paraUsuarioPublico(usuariosMock[0]))
  }),

  http.patch(`${API_BASE_URL}/usuarios/me`, async () => {
    // O backend real também não devolve `telefone` na resposta (só aceita no
    // PATCH) — o mock replica essa lacuna de propósito.
    return HttpResponse.json(paraUsuarioPublico(usuariosMock[0]))
  }),

  http.get(`${API_BASE_URL}/usuarios/me/preferencias`, () => {
    return HttpResponse.json(preferenciasMock)
  }),

  http.patch(`${API_BASE_URL}/usuarios/me/preferencias`, async ({ request }) => {
    const body = (await request.json()) as PreferenciaUsuario

    if (body.notifAlertasCriticos === false) {
      return HttpResponse.json(
        { mensagem: 'Notificacao de alertas criticos nao pode ser desativada' },
        { status: 422 },
      )
    }

    preferenciasMock = { ...body, notifAlertasCriticos: true }
    return HttpResponse.json(preferenciasMock)
  }),

  http.get(`${API_BASE_URL}/animais`, ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const especie = url.searchParams.get('especie')
    const baiaId = url.searchParams.get('baiaId')
    const q = url.searchParams.get('q')?.trim().toLowerCase()
    const pagina = Number(url.searchParams.get('pagina') ?? '0')
    const tamanho = Number(url.searchParams.get('tamanho') ?? '20')

    const filtrados = animaisMock.filter((animal) => {
      const combinaStatus = !status || animal.statusCodigo === status
      const combinaEspecie = !especie || animal.especieCodigo === especie
      const combinaBaia = !baiaId || animal.baiaId === baiaId
      const combinaBusca =
        !q || animal.nome.toLowerCase().includes(q) || (animal.microchip ?? '').toLowerCase().includes(q)
      return combinaStatus && combinaEspecie && combinaBaia && combinaBusca
    })

    const totalItens = filtrados.length
    const totalPaginas = Math.max(Math.ceil(totalItens / tamanho), 1)
    const inicio = pagina * tamanho
    const itens = filtrados.slice(inicio, inicio + tamanho)

    return HttpResponse.json({ itens, pagina, tamanho, totalItens, totalPaginas })
  }),

  http.get(`${API_BASE_URL}/animais/catalogos`, () => {
    return HttpResponse.json(CATALOGOS_ANIMAIS_MOCK)
  }),

  http.get(`${API_BASE_URL}/baias`, ({ request }) => {
    const url = new URL(request.url)
    const ativaParam = url.searchParams.get('ativa')
    const pagina = Number(url.searchParams.get('pagina') ?? '0')
    const tamanho = Number(url.searchParams.get('tamanho') ?? '20')

    const filtradas = BAIAS_MOCK.filter((baia) => ativaParam === null || baia.ativa === (ativaParam === 'true'))

    const totalItens = filtradas.length
    const totalPaginas = Math.max(Math.ceil(totalItens / tamanho), 1)
    const inicio = pagina * tamanho
    const itens = filtradas.slice(inicio, inicio + tamanho)

    return HttpResponse.json({ itens, pagina, tamanho, totalItens, totalPaginas })
  }),
]

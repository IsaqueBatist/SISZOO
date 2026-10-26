import { http, HttpResponse } from 'msw'
import type { AlertaVacinalAnimal, AlertaVacinalItem } from '@/features/alertas/types/alertas.types'
import type { Animal, AnimalRequest, AnexoAnimal, Baia, BaiaRequest, CatalogosAnimal } from '@/features/animais/types/animais.types'
import type { CriarExameRequest, Exame } from '@/features/animais/types/historico.types'
import { DIAS_ANTECEDENCIA_ALERTA_VACINA, diasAteVencimento, hojeEmItu } from '@/features/animais/utils/regrasVacina'
import { adicionarDiasIso, agoraEmItu } from '@/lib/datas'
import type {
  CategoriaFarmacologica,
  CriarPrescricaoRequest,
  CriarProcedimentoRequest,
  CriarVacinacaoRequest,
  Medicamento,
  Prescricao,
  Procedimento,
  StatusRegistroClinico,
  UnidadeDose,
  Vacinacao,
} from '@/features/animais/types/historico.types'
import type { LoginRequest, LoginResponse } from '@/features/auth/types/auth.types'
import type { EventoAuditoria } from '@/features/auditoria/types/auditoria.types'
import { API_BASE_URL } from '../lib/env'
import { ocorrenciasHandlers } from './ocorrenciasHandlers'
import { processosHandlers } from './processosHandlers'
import { relatoriosHandlers } from './relatoriosHandlers'
import type { CriarUsuarioRequest, UsuarioListItem } from '@/features/usuarios/types/usuarios.types'
import type { PreferenciaUsuario } from '@/features/configuracoes/types/configuracoes.types'

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
    senhaAlteradaEm: '2026-01-10T12:00:00',
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
      senhaAlteradaEm: '2026-01-10T12:00:00',
      ativo: true,
      ultimoAcesso: '2026-05-20T14:32:00',
      criadoEm: '2024-03-15T09:00:00',
      senhaInicial: CREDENCIAIS_VALIDAS.senha,
    },
    {
      id: 'a1b2c3d4-0000-0000-0000-000000000002',
      nome: 'Paulo',
      sobrenome: 'Henriques',
      email: 'paulo.henriques@itu.sp.gov.br',
      cargos: ['Administrador'],
      crmv: null,
      senhaAlteradaEm: '2024-03-15T09:00:00',
      ativo: true,
      ultimoAcesso: '2026-05-20T14:00:00',
      criadoEm: '2024-03-15T09:00:00',
      senhaInicial: 'Itu@2026!',
    },
    {
      id: 'a1b2c3d4-0000-0000-0000-000000000003',
      nome: 'Carlos',
      sobrenome: 'Martins',
      email: 'carlos.martins@itu.sp.gov.br',
      cargos: ['Veterinário'],
      crmv: 'CRMV-SP 05678',
      senhaAlteradaEm: '2024-05-10T09:00:00',
      ativo: true,
      ultimoAcesso: '2026-05-19T17:02:00',
      criadoEm: '2024-05-10T09:00:00',
      senhaInicial: 'Itu@2026!',
    },
    {
      id: 'a1b2c3d4-0000-0000-0000-000000000004',
      nome: 'Rafael',
      sobrenome: 'Santos',
      email: 'rafael.santos@itu.sp.gov.br',
      cargos: ['Agente Sanitário'],
      crmv: null,
      senhaAlteradaEm: '2024-11-03T09:00:00',
      ativo: true,
      ultimoAcesso: '2026-05-20T12:55:00',
      criadoEm: '2024-11-03T09:00:00',
      senhaInicial: 'Itu@2026!',
    },
    {
      id: 'a1b2c3d4-0000-0000-0000-000000000005',
      nome: 'Marcos',
      sobrenome: 'Oliveira',
      email: 'marcos.oliveira@itu.sp.gov.br',
      cargos: ['Agente Sanitário'],
      crmv: null,
      senhaAlteradaEm: '2024-12-20T09:00:00',
      ativo: true,
      ultimoAcesso: '2026-05-20T11:08:00',
      criadoEm: '2024-12-20T09:00:00',
      senhaInicial: 'Itu@2026!',
    },
    {
      id: 'a1b2c3d4-0000-0000-0000-000000000006',
      nome: 'Joana',
      sobrenome: 'Pires',
      email: 'joana.pires@itu.sp.gov.br',
      cargos: ['Veterinário'],
      crmv: 'CRMV-SP 09999',
      senhaAlteradaEm: '2024-09-18T09:00:00',
      ativo: false,
      ultimoAcesso: '2026-02-12T11:00:00',
      criadoEm: '2024-09-18T09:00:00',
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
// fichaCompleta fixa aqui segue fichaCompletaMock: só o Rex tem microchip e
// vacinação (seedVacinacoesMock). Calcular na hora não dá: este seed roda
// antes de vacinacoesMock existir.
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
      dataEntrada: '2024-03-15T09:00:00',
      baiaId: 'c3d4e5f6-0000-0000-0000-000000000001',
      baiaNome: 'Baia 3',
      tipoBaiaNome: 'Canil',
      fichaCompleta: true,
      fotoUrl: null,
      observacoes: null,
      criadoPorId: 'a1b2c3d4-0000-0000-0000-000000000001',
      criadoPorNome: 'Stéphanie Lima',
      criadoEm: '2024-03-15T09:00:00',
      atualizadoEm: '2024-03-15T09:00:00',
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
      dataEntrada: '2024-08-12T10:00:00',
      baiaId: 'c3d4e5f6-0000-0000-0000-000000000002',
      baiaNome: 'Gatil A',
      tipoBaiaNome: 'Gatil',
      fichaCompleta: false,
      fotoUrl: null,
      observacoes: null,
      criadoPorId: 'a1b2c3d4-0000-0000-0000-000000000001',
      criadoPorNome: 'Stéphanie Lima',
      criadoEm: '2024-08-12T10:00:00',
      atualizadoEm: '2024-08-12T10:00:00',
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
      dataEntrada: '2025-02-22T09:00:00',
      baiaId: 'c3d4e5f6-0000-0000-0000-000000000003',
      baiaNome: 'Baia 6',
      tipoBaiaNome: 'Canil',
      fichaCompleta: false,
      fotoUrl: null,
      observacoes: null,
      criadoPorId: 'a1b2c3d4-0000-0000-0000-000000000001',
      criadoPorNome: 'Stéphanie Lima',
      criadoEm: '2025-02-22T09:00:00',
      atualizadoEm: '2025-02-22T09:00:00',
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
      dataEntrada: '2025-04-02T09:00:00',
      baiaId: null,
      baiaNome: null,
      tipoBaiaNome: null,
      fichaCompleta: false,
      fotoUrl: null,
      observacoes: null,
      criadoPorId: 'a1b2c3d4-0000-0000-0000-000000000001',
      criadoPorNome: 'Stéphanie Lima',
      criadoEm: '2025-04-02T09:00:00',
      atualizadoEm: '2025-04-02T09:00:00',
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
      dataEntrada: '2025-05-18T09:00:00',
      baiaId: null,
      baiaNome: null,
      tipoBaiaNome: null,
      fichaCompleta: false,
      fotoUrl: null,
      observacoes: null,
      criadoPorId: 'a1b2c3d4-0000-0000-0000-000000000001',
      criadoPorNome: 'Stéphanie Lima',
      criadoEm: '2025-05-18T09:00:00',
      atualizadoEm: '2025-05-18T09:00:00',
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
      dataEntrada: '2025-09-21T09:00:00',
      baiaId: null,
      baiaNome: null,
      tipoBaiaNome: null,
      fichaCompleta: false,
      fotoUrl: null,
      observacoes: null,
      criadoPorId: 'a1b2c3d4-0000-0000-0000-000000000001',
      criadoPorNome: 'Stéphanie Lima',
      criadoEm: '2025-09-21T09:00:00',
      atualizadoEm: '2025-09-21T09:00:00',
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
      dataEntrada: '2025-06-23T09:00:00',
      baiaId: null,
      baiaNome: null,
      tipoBaiaNome: null,
      fichaCompleta: false,
      fotoUrl: null,
      observacoes: null,
      criadoPorId: 'a1b2c3d4-0000-0000-0000-000000000001',
      criadoPorNome: 'Stéphanie Lima',
      criadoEm: '2025-06-23T09:00:00',
      atualizadoEm: '2025-06-23T09:00:00',
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
      dataEntrada: '2025-05-11T09:00:00',
      baiaId: 'c3d4e5f6-0000-0000-0000-000000000004',
      baiaNome: 'Baia 7',
      tipoBaiaNome: 'Canil',
      fichaCompleta: false,
      fotoUrl: null,
      observacoes: null,
      criadoPorId: 'a1b2c3d4-0000-0000-0000-000000000001',
      criadoPorNome: 'Stéphanie Lima',
      criadoEm: '2025-05-11T09:00:00',
      atualizadoEm: '2025-05-11T09:00:00',
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
      dataEntrada: '2025-01-08T09:00:00',
      baiaId: null,
      baiaNome: null,
      tipoBaiaNome: null,
      fichaCompleta: false,
      fotoUrl: null,
      observacoes: null,
      criadoPorId: 'a1b2c3d4-0000-0000-0000-000000000001',
      criadoPorNome: 'Stéphanie Lima',
      criadoEm: '2025-01-08T09:00:00',
      atualizadoEm: '2025-01-08T09:00:00',
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
      dataEntrada: '2026-02-17T09:00:00',
      baiaId: null,
      baiaNome: null,
      tipoBaiaNome: null,
      fichaCompleta: false,
      fotoUrl: null,
      observacoes: null,
      criadoPorId: 'a1b2c3d4-0000-0000-0000-000000000001',
      criadoPorNome: 'Stéphanie Lima',
      criadoEm: '2026-02-17T09:00:00',
      atualizadoEm: '2026-02-17T09:00:00',
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
    dataEntrada: '2026-01-01T09:00:00',
    baiaId: null,
    baiaNome: null,
    tipoBaiaNome: null,
    fichaCompleta: false,
    fotoUrl: null,
    observacoes: null,
    criadoPorId: 'a1b2c3d4-0000-0000-0000-000000000001',
    criadoPorNome: 'Stéphanie Lima',
    criadoEm: '2026-01-01T09:00:00',
    atualizadoEm: '2026-01-01T09:00:00',
  }
}

function seedTodosAnimaisMock(): Animal[] {
  return [...seedAnimaisMock(), ...Array.from({ length: 12 }, (_, indice) => criarAnimalFiller(indice + 11))]
}

let animaisMock: Animal[] = seedTodosAnimaisMock()

export function resetAnimaisMock() {
  animaisMock = seedTodosAnimaisMock()
}

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
  tiposExame: [
    { codigo: 'hemograma', nome: 'Hemograma' },
    { codigo: 'raspado_pele', nome: 'Raspado de pele' },
    { codigo: 'sorologia', nome: 'Sorologia' },
  ],
  laboratorios: [
    { codigo: 'ial_sorocaba', nome: 'Instituto Adolfo Lutz - Sorocaba' },
    { codigo: 'pasteur_sp', nome: 'Instituto Pasteur' },
  ],
  tiposBaia: [
    { codigo: 'canil', nome: 'Canil' },
    { codigo: 'gatil', nome: 'Gatil' },
  ],
  // Mesmos códigos do seed da V5 (o backend devolve todos em /animais/catalogos).
  vacinas: [
    { codigo: 'antirrabica', nome: 'Antirrábica' },
    { codigo: 'v10', nome: 'V10' },
    { codigo: 'v8', nome: 'V8' },
    { codigo: 'v4_felinos', nome: 'V4 (felinos)' },
    { codigo: 'giardia', nome: 'Giárdia' },
    { codigo: 'gripe_canina', nome: 'Gripe canina' },
    { codigo: 'felv', nome: 'FeLV' },
    { codigo: 'leishmaniose', nome: 'Leishmaniose' },
  ],
  tiposProcedimento: [
    { codigo: 'atendimento_clinico', nome: 'Atendimento clínico' },
    { codigo: 'castracao', nome: 'Castração' },
    { codigo: 'cirurgia_maior', nome: 'Cirurgia maior' },
    { codigo: 'vacinacao', nome: 'Vacinação' },
  ],
}

// IDs alinhados aos baiaId/baiaNome já usados em seedAnimaisMock (Rex, Luna,
// Bidu, Bob), mais uma baia inativa para exercitar o filtro de status e uma
// superlotada/em atenção para exercitar o destaque visual da T19.
function seedBaiasMock(): Baia[] {
  return [
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
    {
      id: 'c3d4e5f6-0000-0000-0000-000000000006',
      nome: 'Baia 9',
      tipoBaiaCodigo: 'canil',
      tipoBaiaNome: 'Canil',
      capacidade: 2,
      finalidade: null,
      ativa: true,
      observacoes: null,
      ocupacaoAtual: 2,
      superlotada: true,
    },
    {
      id: 'c3d4e5f6-0000-0000-0000-000000000007',
      nome: 'Baia 10',
      tipoBaiaCodigo: 'canil',
      tipoBaiaNome: 'Canil',
      capacidade: 3,
      finalidade: null,
      ativa: true,
      observacoes: null,
      ocupacaoAtual: 0,
      superlotada: false,
    },
  ]
}

let baiasMock: Baia[] = seedBaiasMock()

export function resetBaiasMock() {
  baiasMock = seedBaiasMock()
}

function nomeDoCatalogo(itens: { codigo: string; nome: string }[], codigo: string): string {
  return itens.find((item) => item.codigo === codigo)?.nome ?? codigo
}

// Espelha FichaCompletaService (DER §3.2): microchip com texto e ao menos uma
// vacinação que nenhuma outra retifica. Recalculada no POST/PUT do animal e a
// cada POST de vacinação, como no backend.
function fichaCompletaMock(animalId: string, microchip: string | null): boolean {
  if (!microchip?.trim()) return false
  return vacinacoesMock.some(
    (vacinacao) => vacinacao.animalId === animalId && !vacinacoesMock.some((outra) => outra.retificaId === vacinacao.id),
  )
}

// Recompõe um `Animal` (resposta) a partir de um `AnimalRequest` (o que o
// form de T18 envia) — espelha o que o service real faz ao resolver os
// códigos de espécie/status/motivo/baia para os nomes exibidos.
function construirAnimalMock(id: string, body: AnimalRequest, existente: Animal | null): Animal {
  const baia = body.baiaId ? baiasMock.find((item) => item.id === body.baiaId) : undefined
  const agora = agoraEmItu()
  return {
    id,
    nome: body.nome,
    especieCodigo: body.especie,
    especieNome: nomeDoCatalogo(CATALOGOS_ANIMAIS_MOCK.especies, body.especie),
    sexo: body.sexo,
    raca: body.raca ?? null,
    coloracao: body.coloracao ?? null,
    pelagem: body.pelagem ?? null,
    porte: body.porte ?? null,
    pesoKg: body.pesoKg ?? null,
    idadeAprox: body.idadeAprox ?? null,
    dataNascimentoAprox: body.dataNascimentoAprox ?? null,
    microchip: body.microchip ?? null,
    esterilizado: body.esterilizado,
    dataEsterilizacao: body.dataEsterilizacao ?? null,
    statusCodigo: body.status,
    statusNome: nomeDoCatalogo(CATALOGOS_ANIMAIS_MOCK.status, body.status),
    motivoEntradaCodigo: body.motivoEntrada,
    motivoEntradaNome: nomeDoCatalogo(CATALOGOS_ANIMAIS_MOCK.motivosEntrada, body.motivoEntrada),
    dataEntrada: body.dataEntrada,
    baiaId: body.baiaId ?? null,
    baiaNome: baia?.nome ?? null,
    tipoBaiaNome: baia?.tipoBaiaNome ?? null,
    fichaCompleta: fichaCompletaMock(id, body.microchip ?? null),
    fotoUrl: body.fotoUrl ?? null,
    observacoes: body.observacoes ?? null,
    criadoPorId: existente?.criadoPorId ?? usuariosMock[0].id,
    criadoPorNome: existente?.criadoPorNome ?? `${usuariosMock[0].nome} ${usuariosMock[0].sobrenome}`,
    criadoEm: existente?.criadoEm ?? agora,
    atualizadoEm: agora,
  }
}

// Registros clínicos: o mock guarda os campos crus +
// `retificaId`, e deriva `retificadoPorId`/`statusRegistro` do mesmo jeito
// que o mapper real do backend faz — nunca armazenados diretamente.
type RegistroClinicoBruto = { id: string; retificaId: string | null }

function derivarStatusRegistro<T extends RegistroClinicoBruto>(
  itens: T[],
): (T & { retificadoPorId: string | null; statusRegistro: StatusRegistroClinico })[] {
  return itens.map((item) => {
    const retificadoPor = itens.find((outro) => outro.retificaId === item.id)
    return {
      ...item,
      retificadoPorId: retificadoPor?.id ?? null,
      statusRegistro: retificadoPor ? 'RETIFICADO' : 'ATIVO',
    }
  })
}

const ANIMAL_REX_ID = 'b2c3d4e5-0000-0000-0000-000000000001'

// Datas civis relativas ao dia de Itu (o handler de alertas compara com
// hojeEmItu, como o backend). Partir do dia UTC deslocava tudo em 1 dia entre
// 21:00 e 23:59 em Itu (datasMock.test.ts).
function addDiasIso(dias: number): string {
  return adicionarDiasIso(hojeEmItu(), dias)
}

type VacinacaoMockInterna = Omit<Vacinacao, 'retificadoPorId' | 'statusRegistro'>

function seedVacinacoesMock(): VacinacaoMockInterna[] {
  const veterinaria = { id: usuariosMock[0].id, nome: `${usuariosMock[0].nome} ${usuariosMock[0].sobrenome}` }
  return [
    {
      id: 'd1000000-0000-0000-0000-000000000001',
      animalId: ANIMAL_REX_ID,
      vacinaCodigo: 'v10',
      vacinaNome: 'V10',
      aplicadoPorId: veterinaria.id,
      aplicadoPorNome: veterinaria.nome,
      dataAplicacao: addDiasIso(-400),
      dataValidade: addDiasIso(-10), // vencida
      numeroDose: 1,
      doseQuantidade: 1,
      doseUnidade: 'MILILITRO',
      lote: '22B-4451',
      observacoes: null,
      retificaId: null,
      criadoEm: `${addDiasIso(-400)}T09:00:00`,
    },
    {
      id: 'd1000000-0000-0000-0000-000000000002',
      animalId: ANIMAL_REX_ID,
      vacinaCodigo: 'antirrabica',
      vacinaNome: 'Antirrábica',
      aplicadoPorId: veterinaria.id,
      aplicadoPorNome: veterinaria.nome,
      dataAplicacao: addDiasIso(-360),
      dataValidade: addDiasIso(5), // a vencer (≤ 7 dias)
      numeroDose: 1,
      doseQuantidade: 1,
      doseUnidade: 'MILILITRO',
      lote: '18A-9923',
      observacoes: null,
      retificaId: null,
      criadoEm: `${addDiasIso(-360)}T09:00:00`,
    },
    {
      id: 'd1000000-0000-0000-0000-000000000003',
      animalId: ANIMAL_REX_ID,
      vacinaCodigo: 'giardia',
      vacinaNome: 'Giárdia',
      aplicadoPorId: veterinaria.id,
      aplicadoPorNome: veterinaria.nome,
      dataAplicacao: addDiasIso(-30),
      dataValidade: addDiasIso(335), // em dia
      numeroDose: 1,
      doseQuantidade: 1,
      doseUnidade: 'MILILITRO',
      lote: null,
      observacoes: null,
      retificaId: null,
      criadoEm: `${addDiasIso(-30)}T09:00:00`,
    },
    // Par retificado: o registro 004 é corrigido pelo 005 (aponta retificaId
    // de volta para 004) — 004 deve aparecer como "RETIFICADO", 005 "ATIVO".
    {
      id: 'd1000000-0000-0000-0000-000000000004',
      animalId: ANIMAL_REX_ID,
      vacinaCodigo: 'leishmaniose',
      vacinaNome: 'Leishmaniose',
      aplicadoPorId: veterinaria.id,
      aplicadoPorNome: veterinaria.nome,
      dataAplicacao: addDiasIso(-100),
      dataValidade: addDiasIso(265),
      numeroDose: 1,
      doseQuantidade: 1,
      doseUnidade: 'MILILITRO',
      lote: 'LOTE-ERRADO',
      observacoes: null,
      retificaId: null,
      criadoEm: `${addDiasIso(-100)}T09:00:00`,
    },
    {
      id: 'd1000000-0000-0000-0000-000000000005',
      animalId: ANIMAL_REX_ID,
      vacinaCodigo: 'leishmaniose',
      vacinaNome: 'Leishmaniose',
      aplicadoPorId: veterinaria.id,
      aplicadoPorNome: veterinaria.nome,
      dataAplicacao: addDiasIso(-100),
      dataValidade: addDiasIso(265),
      numeroDose: 1,
      doseQuantidade: 1,
      doseUnidade: 'MILILITRO',
      lote: 'LOTE-CORRIGIDO',
      observacoes: 'Correção de lote informado errado.',
      retificaId: 'd1000000-0000-0000-0000-000000000004',
      criadoEm: `${addDiasIso(-99)}T09:00:00`,
    },
  ]
}

// Seed V5 do backend: toda vacina do catálogo tem intervalo_meses = 12
// (provisório, pendente de decisão do CCZ — ver docs/regras-negocio-clinico.md).
const INTERVALO_MESES_SEED_V5 = 12

// Mesmos códigos de StatusAnimal.CODIGOS_FORA_DA_CUSTODIA (RN-A05).
const STATUS_FORA_DA_CUSTODIA = ['adotado', 'obito_natural', 'obito_eutanasia', 'transferido']

// Mesma aritmética de LocalDate.plusMonths do backend: se o dia não existe no
// mês de destino, fica no último dia do mês (31/01 + 1 mês = 28 ou 29/02),
// em vez de transbordar para o mês seguinte como Date faz.
function somarMesesIso(isoDate: string, meses: number): string {
  const [ano, mes, dia] = isoDate.split('-').map(Number)
  const ultimoDiaDoMesDestino = new Date(Date.UTC(ano, mes - 1 + meses + 1, 0)).getUTCDate()
  return new Date(Date.UTC(ano, mes - 1 + meses, Math.min(dia, ultimoDiaDoMesDestino))).toISOString().slice(0, 10)
}

let vacinacoesMock: VacinacaoMockInterna[] = seedVacinacoesMock()

export function resetVacinacoesMock() {
  vacinacoesMock = seedVacinacoesMock()
}

type ProcedimentoMockInterno = Omit<Procedimento, 'retificadoPorId' | 'statusRegistro'>

function seedProcedimentosMock(): ProcedimentoMockInterno[] {
  const veterinario = { id: usuariosMock[0].id, nome: `${usuariosMock[0].nome} ${usuariosMock[0].sobrenome}` }
  return [
    {
      id: 'e2000000-0000-0000-0000-000000000001',
      animalId: ANIMAL_REX_ID,
      tipoProcedimentoCodigo: 'castracao',
      tipoProcedimentoNome: 'Castração',
      executadoPorId: veterinario.id,
      executadoPorNome: veterinario.nome,
      data: addDiasIso(-250),
      descricao: 'Orquiectomia eletiva.',
      resultado: 'Sem intercorrências. Alta no mesmo dia.',
      retificaId: null,
      criadoEm: `${addDiasIso(-250)}T09:00:00`,
    },
    {
      id: 'e2000000-0000-0000-0000-000000000002',
      animalId: ANIMAL_REX_ID,
      tipoProcedimentoCodigo: 'atendimento_clinico',
      tipoProcedimentoNome: 'Atendimento clínico',
      executadoPorId: veterinario.id,
      executadoPorNome: veterinario.nome,
      data: addDiasIso(-15),
      descricao: 'Consulta de rotina.',
      resultado: null,
      retificaId: null,
      criadoEm: `${addDiasIso(-15)}T09:00:00`,
    },
  ]
}

let procedimentosMock: ProcedimentoMockInterno[] = seedProcedimentosMock()

// F2-007 / RF-A04: exames e anexos do animal (vazios por padrão; os testes semeiam o que precisam).
type ExameMockInterno = Omit<Exame, 'retificadoPorId' | 'statusRegistro'>
let examesMock: ExameMockInterno[] = []
let anexosAnimalMock: AnexoAnimal[] = []
export function resetExamesEAnexosMock() {
  examesMock = []
  anexosAnimalMock = []
}

export function resetProcedimentosMock() {
  procedimentosMock = seedProcedimentosMock()
}

const MEDICAMENTO_FENOBARBITAL_ID = 'f3000000-0000-0000-0000-000000000001'

// Dados fictícios só do mock (o backend real não tem seed de medicamentos nem
// de categorias: o CCZ cadastra os reais pela tela de medicamentos).
function seedMedicamentosMock(): Medicamento[] {
  return [
    { id: MEDICAMENTO_FENOBARBITAL_ID, nome: 'Fenobarbital 30mg', categoriaId: 'cat-1', categoriaNome: 'Anticonvulsivante', ativo: true },
    { id: 'f3000000-0000-0000-0000-000000000002', nome: 'Amoxicilina 250mg', categoriaId: 'cat-2', categoriaNome: 'Antibiótico', ativo: true },
  ]
}

function seedCategoriasFarmacologicasMock(): CategoriaFarmacologica[] {
  return [
    { id: 'cat-1', nome: 'Anticonvulsivante', ativo: true },
    { id: 'cat-2', nome: 'Antibiótico', ativo: true },
  ]
}

let medicamentosMock: Medicamento[] = seedMedicamentosMock()
let categoriasFarmacologicasMock: CategoriaFarmacologica[] = seedCategoriasFarmacologicasMock()

export function resetMedicamentosMock() {
  medicamentosMock = seedMedicamentosMock()
  categoriasFarmacologicasMock = seedCategoriasFarmacologicasMock()
}

type PrescricaoMockInterna = Omit<Prescricao, 'retificadoPorId' | 'statusRegistro'>

function seedPrescricoesMock(): PrescricaoMockInterna[] {
  const veterinaria = { id: usuariosMock[0].id, nome: `${usuariosMock[0].nome} ${usuariosMock[0].sobrenome}` }
  return [
    {
      id: 'g4000000-0000-0000-0000-000000000001',
      animalId: ANIMAL_REX_ID,
      medicamentoId: MEDICAMENTO_FENOBARBITAL_ID,
      medicamentoNome: 'Fenobarbital 30mg',
      prescritoPorId: veterinaria.id,
      prescritoPorNome: veterinaria.nome,
      dataInicio: addDiasIso(-20),
      dataFimPrevista: addDiasIso(70),
      dataFimReal: null,
      frequenciaAplicada: 2,
      unidadeFrequencia: 'DIAS',
      doseQuantidade: 1,
      doseUnidade: 'MILIGRAMA',
      viaAdministracao: 'ORAL',
      status: 'ATIVA',
      retificaId: null,
      criadoEm: `${addDiasIso(-20)}T09:00:00`,
    },
  ]
}

let prescricoesMock: PrescricaoMockInterna[] = seedPrescricoesMock()

export function resetPrescricoesMock() {
  prescricoesMock = seedPrescricoesMock()
}

// Alguns eventos "hoje", alguns "ontem", um mais antigo — exercita o
// agrupamento por dia da tela de Logs (agruparPorDia.ts) sem precisar de
// fixture dedicada em cada teste.
function seedAuditoriaMock(): EventoAuditoria[] {
  const agora = Date.now()
  const HORA_MS = 60 * 60 * 1000
  const DIA_MS = 24 * HORA_MS
  return [
    {
      id: 'e5000000-0000-0000-0000-000000000001',
      usuarioEmail: 'stephanie.lima@itu.sp.gov.br',
      acao: 'LOGIN',
      entidade: 'usuario',
      entidadeId: 'a1b2c3d4-0000-0000-0000-000000000001',
      ocorreuEm: new Date(agora - 1 * HORA_MS).toISOString(),
    },
    {
      id: 'e5000000-0000-0000-0000-000000000002',
      usuarioEmail: 'stephanie.lima@itu.sp.gov.br',
      acao: 'CRIACAO',
      entidade: 'vacinacao',
      entidadeId: 'd1000000-0000-0000-0000-000000000001',
      ocorreuEm: new Date(agora - 2 * HORA_MS).toISOString(),
    },
    {
      id: 'e5000000-0000-0000-0000-000000000003',
      usuarioEmail: 'paulo.henriques@itu.sp.gov.br',
      acao: 'ATUALIZACAO',
      entidade: 'usuario',
      entidadeId: 'a1b2c3d4-0000-0000-0000-000000000002',
      ocorreuEm: new Date(agora - DIA_MS - 3 * HORA_MS).toISOString(),
    },
    {
      id: 'e5000000-0000-0000-0000-000000000004',
      usuarioEmail: 'rafael.santos@itu.sp.gov.br',
      acao: 'VISUALIZACAO',
      entidade: 'ocorrencia',
      entidadeId: 'h5000000-0000-0000-0000-000000000001',
      ocorreuEm: new Date(agora - DIA_MS - 5 * HORA_MS).toISOString(),
    },
    {
      id: 'e5000000-0000-0000-0000-000000000005',
      usuarioEmail: 'ana.silva@itu.sp.gov.br',
      acao: 'CRIACAO',
      entidade: 'processo_sanitario',
      entidadeId: 'h7000000-0000-0000-0000-000000000001',
      ocorreuEm: new Date(agora - 3 * DIA_MS).toISOString(),
    },
  ]
}

let auditoriaMock: EventoAuditoria[] = seedAuditoriaMock()

export function resetAuditoriaMock() {
  auditoriaMock = seedAuditoriaMock()
}

function paginar<T>(itens: T[], pagina: number, tamanho: number) {
  const totalItens = itens.length
  const totalPaginas = Math.max(Math.ceil(totalItens / tamanho), 1)
  const inicio = pagina * tamanho
  return { itens: itens.slice(inicio, inicio + tamanho), pagina, tamanho, totalItens, totalPaginas }
}

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
      criadoEm: agoraEmItu(),
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

    const filtradas = baiasMock.filter((baia) => ativaParam === null || baia.ativa === (ativaParam === 'true'))

    const totalItens = filtradas.length
    const totalPaginas = Math.max(Math.ceil(totalItens / tamanho), 1)
    const inicio = pagina * tamanho
    const itens = filtradas.slice(inicio, inicio + tamanho)

    return HttpResponse.json({ itens, pagina, tamanho, totalItens, totalPaginas })
  }),

  // T45: residentes (sob custódia) de todas as baias, como o backend — por nome.
  http.get(`${API_BASE_URL}/baias/residentes`, () => {
    const residentes = animaisMock
      .filter((animal) => animal.baiaId && !STATUS_FORA_DA_CUSTODIA.includes(animal.statusCodigo))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
      .map((animal) => ({ baiaId: animal.baiaId, id: animal.id, nome: animal.nome, fotoUrl: animal.fotoUrl }))
    return HttpResponse.json(residentes)
  }),

  http.post(`${API_BASE_URL}/baias`, async ({ request }) => {
    const body = (await request.json()) as BaiaRequest
    const tipo = CATALOGOS_ANIMAIS_MOCK.tiposBaia.find((item) => item.codigo === body.tipoBaia)
    if (!tipo) {
      return HttpResponse.json({ mensagem: 'Tipo de baia informado nao existe' }, { status: 422 })
    }

    const novaBaia: Baia = {
      id: crypto.randomUUID(),
      nome: body.nome,
      tipoBaiaCodigo: tipo.codigo,
      tipoBaiaNome: tipo.nome,
      capacidade: body.capacidade,
      finalidade: body.finalidade ?? null,
      ativa: true,
      observacoes: body.observacoes ?? null,
      ocupacaoAtual: 0,
      superlotada: false,
    }

    baiasMock = [...baiasMock, novaBaia]
    return HttpResponse.json(novaBaia, { status: 201 })
  }),

  http.put(`${API_BASE_URL}/baias/:id`, async ({ params, request }) => {
    const baia = baiasMock.find((item) => item.id === params.id)
    if (!baia) {
      return HttpResponse.json({ mensagem: 'Baia nao encontrada' }, { status: 404 })
    }

    const body = (await request.json()) as BaiaRequest
    const tipo = CATALOGOS_ANIMAIS_MOCK.tiposBaia.find((item) => item.codigo === body.tipoBaia)
    if (!tipo) {
      return HttpResponse.json({ mensagem: 'Tipo de baia informado nao existe' }, { status: 422 })
    }

    const baiaAtualizada: Baia = {
      ...baia,
      nome: body.nome,
      tipoBaiaCodigo: tipo.codigo,
      tipoBaiaNome: tipo.nome,
      capacidade: body.capacidade,
      finalidade: body.finalidade ?? null,
      observacoes: body.observacoes ?? null,
      superlotada: baia.ocupacaoAtual >= body.capacidade,
    }
    baiasMock = baiasMock.map((item) => (item.id === baia.id ? baiaAtualizada : item))
    return HttpResponse.json(baiaAtualizada)
  }),

  http.delete(`${API_BASE_URL}/baias/:id`, ({ params }) => {
    const baia = baiasMock.find((item) => item.id === params.id)
    if (!baia) {
      return HttpResponse.json({ mensagem: 'Baia nao encontrada' }, { status: 404 })
    }

    // Espelha o backend real: soft-delete, sempre sucede mesmo com animais
    // alocados (ver BaiaController#desativar).
    const baiaDesativada: Baia = { ...baia, ativa: false }
    baiasMock = baiasMock.map((item) => (item.id === baia.id ? baiaDesativada : item))
    return HttpResponse.json(baiaDesativada)
  }),

  http.patch(`${API_BASE_URL}/baias/:id/status`, async ({ params, request }) => {
    const baia = baiasMock.find((item) => item.id === params.id)
    if (!baia) {
      return HttpResponse.json({ mensagem: 'Baia nao encontrada' }, { status: 404 })
    }

    const { ativa } = (await request.json()) as { ativa: boolean }
    const baiaAtualizada: Baia = { ...baia, ativa }
    baiasMock = baiasMock.map((item) => (item.id === baia.id ? baiaAtualizada : item))
    return HttpResponse.json(baiaAtualizada)
  }),

  http.get(`${API_BASE_URL}/animais/:id`, ({ params }) => {
    const animal = animaisMock.find((item) => item.id === params.id)
    if (!animal) {
      return HttpResponse.json({ mensagem: 'Animal nao encontrado' }, { status: 404 })
    }
    return HttpResponse.json(animal)
  }),

  http.post(`${API_BASE_URL}/animais`, async ({ request }) => {
    const body = (await request.json()) as AnimalRequest

    if (body.microchip && animaisMock.some((item) => item.microchip === body.microchip)) {
      return HttpResponse.json({ mensagem: 'Microchip ja cadastrado' }, { status: 409 })
    }

    const novoAnimal = construirAnimalMock(crypto.randomUUID(), body, null)
    animaisMock = [...animaisMock, novoAnimal]
    return HttpResponse.json(novoAnimal, { status: 201 })
  }),

  http.put(`${API_BASE_URL}/animais/:id`, async ({ params, request }) => {
    const animal = animaisMock.find((item) => item.id === params.id)
    if (!animal) {
      return HttpResponse.json({ mensagem: 'Animal nao encontrado' }, { status: 404 })
    }

    const body = (await request.json()) as AnimalRequest

    if (animal.microchip && body.microchip && body.microchip !== animal.microchip) {
      return HttpResponse.json({ mensagem: 'Microchip nao pode ser alterado apos definido' }, { status: 422 })
    }

    if (body.microchip && animaisMock.some((item) => item.id !== animal.id && item.microchip === body.microchip)) {
      return HttpResponse.json({ mensagem: 'Microchip ja cadastrado' }, { status: 409 })
    }

    const animalAtualizado = construirAnimalMock(animal.id, body, animal)
    animaisMock = animaisMock.map((item) => (item.id === animal.id ? animalAtualizado : item))
    return HttpResponse.json(animalAtualizado)
  }),

  http.get(`${API_BASE_URL}/vacinacoes`, ({ request }) => {
    const url = new URL(request.url)
    const animalId = url.searchParams.get('animalId')
    const pagina = Number(url.searchParams.get('pagina') ?? '0')
    const tamanho = Number(url.searchParams.get('tamanho') ?? '20')
    const filtrados = derivarStatusRegistro(vacinacoesMock)
      .filter((item) => !animalId || item.animalId === animalId)
      .sort((a, b) => (a.dataAplicacao < b.dataAplicacao ? 1 : -1))
    return HttpResponse.json(paginar(filtrados, pagina, tamanho))
  }),

  http.post(`${API_BASE_URL}/vacinacoes`, async ({ request }) => {
    // doseUnidade opcional aqui de propósito: o mock precisa aceitar o corpo
    // sem ela para responder o 422 como o backend real.
    const body = (await request.json()) as Omit<CriarVacinacaoRequest, 'doseUnidade'> & { doseUnidade?: UnidadeDose }
    // Mesmos 422 do backend: Bean Validation (RN-C05) e VacinacaoService (RN-C06).
    if (!body.doseUnidade) {
      return HttpResponse.json(
        { mensagem: 'Dados invalidos', campos: [{ campo: 'doseUnidade', mensagem: 'não deve ser nulo' }] },
        { status: 422 },
      )
    }
    if (body.dataAplicacao > hojeEmItu()) {
      return HttpResponse.json({ mensagem: 'Data de aplicacao nao pode ser futura' }, { status: 422 })
    }
    const novo: VacinacaoMockInterna = {
      id: crypto.randomUUID(),
      animalId: body.animalId,
      vacinaCodigo: body.vacina,
      vacinaNome: CATALOGOS_ANIMAIS_MOCK.vacinas.find((item) => item.codigo === body.vacina)?.nome ?? body.vacina,
      aplicadoPorId: usuariosMock[0].id,
      aplicadoPorNome: `${usuariosMock[0].nome} ${usuariosMock[0].sobrenome}`,
      dataAplicacao: body.dataAplicacao,
      dataValidade: somarMesesIso(body.dataAplicacao, INTERVALO_MESES_SEED_V5),
      numeroDose: body.numeroDose ?? null,
      doseQuantidade: body.doseQuantidade,
      doseUnidade: body.doseUnidade,
      lote: body.lote ?? null,
      observacoes: body.observacoes ?? null,
      retificaId: body.retificaId ?? null,
      criadoEm: agoraEmItu(),
    }
    vacinacoesMock = [...vacinacoesMock, novo]
    animaisMock = animaisMock.map((animal) =>
      animal.id === body.animalId ? { ...animal, fichaCompleta: fichaCompletaMock(animal.id, animal.microchip) } : animal,
    )
    const [comStatus] = derivarStatusRegistro([novo])
    return HttpResponse.json(comStatus, { status: 201 })
  }),

  // Espelha GET /api/alertas/vacinas (AlertaVacinalService): só o fim da
  // cadeia de retificação e a aplicação mais recente de cada (animal, vacina)
  // (RN-A02), só animais sob custódia (RN-A05), janela até hoje+7 (RN-A01).
  http.get(`${API_BASE_URL}/alertas/vacinas`, () => {
    const hoje = hojeEmItu()
    const vigentes = new Map<string, VacinacaoMockInterna>()
    derivarStatusRegistro(vacinacoesMock)
      .filter((item) => item.statusRegistro === 'ATIVO' && item.dataValidade !== null)
      .forEach((item) => {
        const chave = `${item.animalId}|${item.vacinaCodigo}`
        const atual = vigentes.get(chave)
        const maisRecente =
          !atual ||
          item.dataAplicacao > atual.dataAplicacao ||
          (item.dataAplicacao === atual.dataAplicacao && item.criadoEm > atual.criadoEm)
        if (maisRecente) vigentes.set(chave, item)
      })

    const porAnimal = new Map<string, AlertaVacinalAnimal>()
    for (const vacinacao of vigentes.values()) {
      const animal = animaisMock.find((item) => item.id === vacinacao.animalId)
      if (!animal || STATUS_FORA_DA_CUSTODIA.includes(animal.statusCodigo)) continue
      const dataValidade = vacinacao.dataValidade as string
      const diasRestantes = diasAteVencimento(dataValidade, hoje)
      if (diasRestantes > DIAS_ANTECEDENCIA_ALERTA_VACINA) continue

      const item: AlertaVacinalItem = {
        vacinacaoId: vacinacao.id,
        vacinaId: vacinacao.vacinaCodigo,
        vacinaNome: vacinacao.vacinaNome,
        dataAplicacao: vacinacao.dataAplicacao,
        dataValidade,
        diasRestantes,
        severidade: diasRestantes < 0 ? 'VENCIDA' : 'A_VENCER',
        veterinarioNome: vacinacao.aplicadoPorNome,
      }
      const existente = porAnimal.get(animal.id)
      if (existente) {
        existente.vacinas.push(item)
      } else {
        porAnimal.set(animal.id, {
          animalId: animal.id,
          animalNome: animal.nome,
          animalMicrochip: animal.microchip,
          animalEspecieNome: animal.especieNome,
          animalSexo: animal.sexo,
          animalBaiaNome: animal.baiaNome,
          vacinas: [item],
        })
      }
    }
    return HttpResponse.json([...porAnimal.values()])
  }),

  http.get(`${API_BASE_URL}/procedimentos`, ({ request }) => {
    const url = new URL(request.url)
    const animalId = url.searchParams.get('animalId')
    const pagina = Number(url.searchParams.get('pagina') ?? '0')
    const tamanho = Number(url.searchParams.get('tamanho') ?? '20')
    const filtrados = derivarStatusRegistro(procedimentosMock)
      .filter((item) => !animalId || item.animalId === animalId)
      .sort((a, b) => (a.data < b.data ? 1 : -1))
    return HttpResponse.json(paginar(filtrados, pagina, tamanho))
  }),

  // F2-007 / RF-A04: exames (registro imutável, correção por retificaId).
  http.get(`${API_BASE_URL}/exames`, ({ request }) => {
    const url = new URL(request.url)
    const animalId = url.searchParams.get('animalId')
    const pagina = Number(url.searchParams.get('pagina') ?? '0')
    const tamanho = Number(url.searchParams.get('tamanho') ?? '20')
    const filtrados = derivarStatusRegistro(examesMock).filter((e) => !animalId || e.animalId === animalId)
    return HttpResponse.json(paginar(filtrados, pagina, tamanho))
  }),

  http.post(`${API_BASE_URL}/exames`, async ({ request }) => {
    const body = (await request.json()) as CriarExameRequest
    const novo: ExameMockInterno = {
      id: crypto.randomUUID(),
      animalId: body.animalId,
      tipoExameCodigo: body.tipoExame,
      tipoExameNome: CATALOGOS_ANIMAIS_MOCK.tiposExame?.find((item) => item.codigo === body.tipoExame)?.nome ?? body.tipoExame,
      laboratorioCodigo: body.laboratorio ?? null,
      laboratorioNome: CATALOGOS_ANIMAIS_MOCK.laboratorios?.find((item) => item.codigo === body.laboratorio)?.nome ?? null,
      solicitadoPorId: usuariosMock[0].id,
      solicitadoPorNome: `${usuariosMock[0].nome} ${usuariosMock[0].sobrenome}`,
      dataSolicitacao: body.dataSolicitacao,
      dataResultado: body.dataResultado ?? null,
      resultado: body.resultado ?? null,
      observacoes: body.observacoes ?? null,
      retificaId: body.retificaId ?? null,
      criadoEm: agoraEmItu(),
    }
    examesMock = [...examesMock, novo]
    const [comStatus] = derivarStatusRegistro([novo])
    return HttpResponse.json(comStatus, { status: 201 })
  }),

  // F2-007 / RF-A04: anexos do animal (metadados; download devolve bytes).
  http.get(`${API_BASE_URL}/animais/:id/anexos`, ({ params }) => {
    return HttpResponse.json(anexosAnimalMock.filter((a) => a.animalId === params.id))
  }),

  http.post(`${API_BASE_URL}/animais/:id/anexos`, async ({ params, request }) => {
    const formulario = await request.formData()
    const arquivo = formulario.get('arquivo') as File | null
    if (!arquivo) return HttpResponse.json({ mensagem: 'Anexo invalido' }, { status: 422 })
    const novo: AnexoAnimal = {
      id: crypto.randomUUID(),
      animalId: String(params.id),
      nome: arquivo.name,
      mimeType: arquivo.type || 'application/octet-stream',
      tamanho: arquivo.size,
      descricao: (formulario.get('descricao') as string | null) ?? null,
      criadoPorId: usuariosMock[0].id,
      criadoPorNome: `${usuariosMock[0].nome} ${usuariosMock[0].sobrenome}`,
      criadoEm: agoraEmItu(),
    }
    anexosAnimalMock = [...anexosAnimalMock, novo]
    return HttpResponse.json(novo, { status: 201 })
  }),

  http.get(`${API_BASE_URL}/animais/:id/anexos/:anexoId`, () => {
    return new HttpResponse(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), { headers: { 'Content-Type': 'image/png' } })
  }),

  http.post(`${API_BASE_URL}/procedimentos`, async ({ request }) => {
    const body = (await request.json()) as CriarProcedimentoRequest
    const novo: ProcedimentoMockInterno = {
      id: crypto.randomUUID(),
      animalId: body.animalId,
      tipoProcedimentoCodigo: body.tipoProcedimento,
      tipoProcedimentoNome:
        CATALOGOS_ANIMAIS_MOCK.tiposProcedimento.find((item) => item.codigo === body.tipoProcedimento)?.nome ??
        body.tipoProcedimento,
      executadoPorId: usuariosMock[0].id,
      executadoPorNome: `${usuariosMock[0].nome} ${usuariosMock[0].sobrenome}`,
      data: body.data,
      descricao: body.descricao ?? null,
      resultado: body.resultado ?? null,
      retificaId: body.retificaId ?? null,
      criadoEm: agoraEmItu(),
    }
    procedimentosMock = [...procedimentosMock, novo]
    const [comStatus] = derivarStatusRegistro([novo])
    return HttpResponse.json(comStatus, { status: 201 })
  }),

  http.get(`${API_BASE_URL}/prescricoes`, ({ request }) => {
    const url = new URL(request.url)
    const animalId = url.searchParams.get('animalId')
    const pagina = Number(url.searchParams.get('pagina') ?? '0')
    const tamanho = Number(url.searchParams.get('tamanho') ?? '20')
    const filtrados = derivarStatusRegistro(prescricoesMock)
      .filter((item) => !animalId || item.animalId === animalId)
      .sort((a, b) => (a.dataInicio < b.dataInicio ? 1 : -1))
    return HttpResponse.json(paginar(filtrados, pagina, tamanho))
  }),

  http.post(`${API_BASE_URL}/prescricoes`, async ({ request }) => {
    const body = (await request.json()) as CriarPrescricaoRequest
    const medicamento = medicamentosMock.find((item) => item.id === body.medicamentoId)
    const novo: PrescricaoMockInterna = {
      id: crypto.randomUUID(),
      animalId: body.animalId,
      medicamentoId: body.medicamentoId,
      medicamentoNome: medicamento?.nome ?? body.medicamentoId,
      prescritoPorId: usuariosMock[0].id,
      prescritoPorNome: `${usuariosMock[0].nome} ${usuariosMock[0].sobrenome}`,
      dataInicio: body.dataInicio,
      dataFimPrevista: body.dataFimPrevista ?? null,
      dataFimReal: body.dataFimReal ?? null,
      frequenciaAplicada: body.frequenciaAplicada,
      unidadeFrequencia: body.unidadeFrequencia,
      doseQuantidade: body.doseQuantidade,
      doseUnidade: body.doseUnidade,
      viaAdministracao: body.viaAdministracao,
      status: body.status,
      retificaId: body.retificaId ?? null,
      criadoEm: agoraEmItu(),
    }
    prescricoesMock = [...prescricoesMock, novo]
    const [comStatus] = derivarStatusRegistro([novo])
    return HttpResponse.json(comStatus, { status: 201 })
  }),

  // F2-027: catálogo de filtros (toda a trilha) e filtros de servidor na listagem.
  http.get(`${API_BASE_URL}/auditoria/filtros`, () =>
    HttpResponse.json({
      acoes: [...new Set(auditoriaMock.map((e) => e.acao))].sort(),
      entidades: [...new Set(auditoriaMock.map((e) => e.entidade))].sort(),
      usuarios: [...new Set(auditoriaMock.map((e) => e.usuarioEmail).filter((e): e is string => Boolean(e)))].sort(),
      modulos: ['USUARIOS_ACESSO', 'GESTAO_ANIMAIS', 'OCORRENCIAS_DENUNCIAS', 'PROCESSOS_SANITARIOS', 'RELATORIOS'],
    }),
  ),

  http.get(`${API_BASE_URL}/auditoria`, ({ request }) => {
    const url = new URL(request.url)
    const pagina = Number(url.searchParams.get('pagina') ?? '0')
    const tamanho = Number(url.searchParams.get('tamanho') ?? '20')
    const acao = url.searchParams.get('acao')
    const entidade = url.searchParams.get('entidade')
    const usuarioEmail = url.searchParams.get('usuarioEmail')
    const filtrados = auditoriaMock.filter(
      (e) => (!acao || e.acao === acao) && (!entidade || e.entidade === entidade) && (!usuarioEmail || e.usuarioEmail === usuarioEmail),
    )
    return HttpResponse.json(paginar(filtrados, pagina, tamanho))
  }),

  http.get(`${API_BASE_URL}/medicamentos`, ({ request }) => {
    const url = new URL(request.url)
    const ativoParam = url.searchParams.get('ativo')
    const pagina = Number(url.searchParams.get('pagina') ?? '0')
    const tamanho = Number(url.searchParams.get('tamanho') ?? '20')
    const filtrados = medicamentosMock.filter((item) => ativoParam === null || item.ativo === (ativoParam === 'true'))
    return HttpResponse.json(paginar(filtrados, pagina, tamanho))
  }),

  http.post(`${API_BASE_URL}/medicamentos`, async ({ request }) => {
    const body = (await request.json()) as { nome?: string; categoriaId?: string }
    const categoria = categoriasFarmacologicasMock.find((item) => item.id === body.categoriaId)
    if (!categoria) {
      return HttpResponse.json({ mensagem: 'Categoria farmacologica informada nao existe' }, { status: 422 })
    }
    const medicamento: Medicamento = {
      id: crypto.randomUUID(),
      nome: body.nome ?? '',
      categoriaId: categoria.id,
      categoriaNome: categoria.nome,
      ativo: true,
    }
    medicamentosMock.push(medicamento)
    return HttpResponse.json(medicamento)
  }),

  // Espelha CategoriaFarmacologicaController: só ativas, por nome; nome
  // repetido (sem diferenciar maiúsculas) responde 409.
  http.get(`${API_BASE_URL}/categorias-farmacologicas`, () =>
    HttpResponse.json(
      categoriasFarmacologicasMock.filter((item) => item.ativo).sort((a, b) => a.nome.localeCompare(b.nome)),
    ),
  ),

  http.post(`${API_BASE_URL}/categorias-farmacologicas`, async ({ request }) => {
    const nome = ((await request.json()) as { nome?: string }).nome?.trim() ?? ''
    if (categoriasFarmacologicasMock.some((item) => item.nome.toLowerCase() === nome.toLowerCase())) {
      return HttpResponse.json({ mensagem: 'Categoria farmacologica ja cadastrada' }, { status: 409 })
    }
    const categoria: CategoriaFarmacologica = { id: crypto.randomUUID(), nome, ativo: true }
    categoriasFarmacologicasMock.push(categoria)
    return HttpResponse.json(categoria)
  }),

  ...ocorrenciasHandlers,
  ...processosHandlers,
  ...relatoriosHandlers,
]

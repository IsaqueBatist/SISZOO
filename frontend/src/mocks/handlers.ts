import { http, HttpResponse } from 'msw'
import type { LoginRequest, LoginResponse } from '../features/auth/auth.types'
import { API_BASE_URL } from '../lib/env'
import type { CriarUsuarioRequest, UsuarioListItem } from '../features/usuarios/usuarios.types'

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

function paraUsuarioPublico({ senhaInicial: _senhaInicial, ...usuario }: UsuarioMockInterno): UsuarioListItem {
  return usuario
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
]

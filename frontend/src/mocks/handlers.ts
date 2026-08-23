import { http, HttpResponse } from 'msw'
import { API_BASE_URL } from '../lib/env'
import type { LoginRequest, LoginResponse } from '../features/auth/auth.types'

// Contrato provisório — o backend real de login (T09) ainda não existe.
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

export const handlers = [
  http.get(`${API_BASE_URL}/health`, () => {
    return HttpResponse.json({ status: 'ok' })
  }),

  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as LoginRequest

    if (body.email === CREDENCIAIS_VALIDAS.email && body.senha === CREDENCIAIS_VALIDAS.senha) {
      return HttpResponse.json(LOGIN_RESPONSE)
    }

    return HttpResponse.json({ mensagem: 'Credenciais inválidas' }, { status: 401 })
  }),
]

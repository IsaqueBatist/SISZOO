/// <reference types="node" />
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FichaAnimal } from '@/features/animais/components/FichaAnimal'
import type { Animal } from '@/features/animais/types/animais.types'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import { Perfil } from '@/features/perfil/components/Perfil'
import { Usuarios } from '@/features/usuarios/components/Usuarios'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'

// Datas com hora da API (criadoEm, ultimoAcesso, atualizadoEm) são
// LocalDateTime sem fuso, já no horário de Itu (AC-1). Lidas com
// `new Date(iso)`, viram horário do navegador: fora de São Paulo a tela
// mostrava outro dia perto da meia-noite. Cada caso roda com o processo em UTC
// (navegador fora de Itu) e em America/Sao_Paulo, e o resultado tem de ser o
// mesmo. O Node aplica a troca de process.env.TZ na hora.

const FUSOS_DO_NAVEGADOR = ['UTC', 'America/Sao_Paulo'] as const
const TZ_ORIGINAL = process.env.TZ

function comCliente(ui: React.ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

function usuarioDaApi(sobrescrever: Record<string, unknown>) {
  return {
    id: 'a1b2c3d4-0000-0000-0000-0000000000aa',
    nome: 'Teste',
    sobrenome: 'Datas',
    email: 'teste.datas@itu.sp.gov.br',
    telefone: null,
    crmv: null,
    ativo: true,
    cargos: ['Administrador'],
    permissoes: [],
    ultimoAcesso: null,
    criadoEm: '2024-03-15T09:00:00',
    senhaAlteradaEm: '2026-01-10T12:00:00',
    ...sobrescrever,
  }
}

describe.each(FUSOS_DO_NAVEGADOR)('navegador em %s', (fuso) => {
  beforeEach(() => {
    process.env.TZ = fuso
  })

  afterEach(() => {
    process.env.TZ = TZ_ORIGINAL
    vi.useRealTimers()
  })

  it('Usuários: último acesso às 00:30 e cadastro na virada do mês mostram o dia de Itu', async () => {
    server.use(
      http.get(`${API_BASE_URL}/usuarios`, () =>
        HttpResponse.json({
          itens: [usuarioDaApi({ ultimoAcesso: '2026-05-20T00:30:00', criadoEm: '2024-03-01T00:30:00' })],
          pagina: 0,
          tamanho: 1,
          totalItens: 1,
          totalPaginas: 1,
        }),
      ),
    )
    comCliente(<Usuarios />)

    expect(await screen.findByText('20/05/2026, 00:30')).toBeInTheDocument()
    expect(screen.getByText('01/03/2024')).toBeInTheDocument()
  })

  it('Perfil: cadastro na virada do ano mostra o dia de Itu', async () => {
    server.use(http.get(`${API_BASE_URL}/usuarios/me`, () => HttpResponse.json(usuarioDaApi({ criadoEm: '2024-01-01T00:30:00' }))))
    comCliente(
      <MemoryRouter>
        <Perfil />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Desde 01/01/2024')).toBeInTheDocument()
  })

  describe('Ficha do animal: "Última atualização" conta dias civis em Itu', () => {
    const REX_ID = 'b2c3d4e5-0000-0000-0000-000000000001'

    async function renderFichaComAtualizacao(atualizadoEm: string) {
      const rex = (await (await fetch(`${API_BASE_URL}/animais/${REX_ID}`)).json()) as Animal
      server.use(http.get(`${API_BASE_URL}/animais/:id`, () => HttpResponse.json({ ...rex, atualizadoEm })))
      sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          token: 'token-existente',
          usuario: {
            id: 'a1b2c3d4-0000-0000-0000-000000000001',
            nome: 'Stéphanie',
            sobrenome: 'Lima',
            email: 'stephanie.lima@itu.sp.gov.br',
            cargos: ['Veterinário'],
            senhaAlteradaEm: '2026-01-10T12:00:00Z',
          },
        }),
      )
      comCliente(
        <MemoryRouter initialEntries={[`/animais/${REX_ID}`]}>
          <AuthProvider>
            <Routes>
              <Route path="/animais/:id" element={<FichaAnimal />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>,
      )
      return (await screen.findByText(/Última atualização/)).textContent ?? ''
    }

    it('atualizado ontem às 10:00, agora 09:30: "há 1 dia" (menos de 24 h, mas outro dia)', async () => {
      vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true })
      vi.setSystemTime(new Date('2030-03-16T12:30:00Z')) // 16/03 09:30 em Itu
      expect(await renderFichaComAtualizacao('2030-03-15T10:00:00')).toContain('Última atualização há 1 dia')
    })

    it('atualizado hoje às 00:10, agora 31/12 21:30: "hoje" (em UTC já é 01/01)', async () => {
      vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true })
      vi.setSystemTime(new Date('2031-01-01T00:30:00Z')) // 31/12 21:30 em Itu
      expect(await renderFichaComAtualizacao('2030-12-31T00:10:00')).toContain('Última atualização hoje')
    })

    it('atualizado em 30/04 23:59, agora 01/05 00:00: "há 1 dia" (virada do mês)', async () => {
      vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true })
      vi.setSystemTime(new Date('2030-05-01T03:00:00Z')) // 01/05 00:00 em Itu
      expect(await renderFichaComAtualizacao('2030-04-30T23:59:00')).toContain('Última atualização há 1 dia')
    })
  })
})

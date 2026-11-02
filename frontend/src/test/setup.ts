import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest'
import { definirSessaoEmMemoria } from '../features/auth/hooks/AuthContext'
import { limparAtividade } from '../lib/sessao/atividade'
import { reiniciarCanal } from '../lib/sessao/canal'
import { cancelarTodosOsSalvamentosAgendados } from '../lib/rascunhoDb'
import { limparToasts } from '../components/toast/toast'
import { limparFiltrosDeListas } from '../lib/useFiltrosLista'
import { server } from '../mocks/server'

configure({ asyncUtilTimeout: 3000 })
import {
  resetAnimaisMock,
  resetAuditoriaMock,
  resetBaiasMock,
  resetMedicamentosMock,
  resetPreferenciasMock,
  resetPrescricoesMock,
  resetProcedimentosMock,
  resetUsuariosMock,
  resetVacinacoesMock,
  resetVacinasMock,
  resetExamesEAnexosMock,
} from '../mocks/handlers'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => {
  vi.stubEnv('VITE_USE_MOCK_KPIS', 'true')
  vi.stubEnv('VITE_USE_MOCK_GRAFICOS', 'true')
  vi.stubGlobal('BroadcastChannel', undefined)
})
afterEach(() => {
  server.resetHandlers()
  sessionStorage.clear()
  definirSessaoEmMemoria(null)
  limparAtividade()
  reiniciarCanal()
  cancelarTodosOsSalvamentosAgendados()
  resetUsuariosMock()
  resetPreferenciasMock()
  resetAnimaisMock()
  resetBaiasMock()
  resetVacinacoesMock()
  resetVacinasMock()
  resetProcedimentosMock()
  resetPrescricoesMock()
  resetMedicamentosMock()
  resetAuditoriaMock()
  resetExamesEAnexosMock()
})
afterAll(() => server.close())

afterEach(() => {
  limparFiltrosDeListas()
  limparToasts()
})

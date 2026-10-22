import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest'
import { server } from '../mocks/server'

// Default de 1000ms para getBy/findBy fica apertado quando a suíte inteira
// roda em paralelo (vários workers do Vitest disputando CPU) e um teste
// depende de debounce + round-trip via MSW + digitação simulada — vira
// flakiness de infraestrutura de teste, não falha de comportamento real.
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
  resetExamesEAnexosMock,
} from '../mocks/handlers'

// 'error': chamada HTTP sem handler falha o teste em vez de passar com um
// aviso — toda rota da API usada nos testes precisa de handler em
// mocks/handlers.ts (ou de um server.use() no próprio teste).
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
// Fase 3 (N-02): o `.env` local pode definir VITE_USE_MOCK_KPIS/GRAFICOS=false
// para desenvolvimento contra o backend real, mas os testes assumem o padrão do
// código (mock quando a variável não é "false"). Neutraliza o .env antes de
// cada teste; quem precisa do modo real faz vi.stubEnv(..., 'false') no teste.
beforeEach(() => {
  vi.stubEnv('VITE_USE_MOCK_KPIS', '')
  vi.stubEnv('VITE_USE_MOCK_GRAFICOS', '')
})
afterEach(() => {
  server.resetHandlers()
  sessionStorage.clear()
  resetUsuariosMock()
  resetPreferenciasMock()
  resetAnimaisMock()
  resetBaiasMock()
  resetVacinacoesMock()
  resetProcedimentosMock()
  resetPrescricoesMock()
  resetMedicamentosMock()
  resetAuditoriaMock()
  resetExamesEAnexosMock()
})
afterAll(() => server.close())

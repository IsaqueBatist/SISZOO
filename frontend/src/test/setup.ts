import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
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
  resetPreferenciasMock,
  resetPrescricoesMock,
  resetProcedimentosMock,
  resetUsuariosMock,
  resetVacinacoesMock,
} from '../mocks/handlers'

// 'error': chamada HTTP sem handler falha o teste em vez de passar com um
// aviso — toda rota da API usada nos testes precisa de handler em
// mocks/handlers.ts (ou de um server.use() no próprio teste).
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
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
  resetAuditoriaMock()
})
afterAll(() => server.close())

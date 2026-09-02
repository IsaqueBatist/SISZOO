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
  resetBaiasMock,
  resetPreferenciasMock,
  resetPrescricoesMock,
  resetProcedimentosMock,
  resetUsuariosMock,
  resetVacinacoesMock,
} from '../mocks/handlers'

// TODO: migrar para 'error' quando as integrações reais de API existirem,
// para acusar chamadas HTTP não-mockadas nos testes.
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
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
})
afterAll(() => server.close())

import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '../mocks/server'
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

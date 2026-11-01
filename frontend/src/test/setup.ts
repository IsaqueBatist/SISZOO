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
  resetVacinasMock,
  resetExamesEAnexosMock,
} from '../mocks/handlers'

// 'error': chamada HTTP sem handler falha o teste em vez de passar com um
// aviso — toda rota da API usada nos testes precisa de handler em
// mocks/handlers.ts (ou de um server.use() no próprio teste).
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
// Fase 3 (N-02): o `.env` local pode definir VITE_USE_MOCK_KPIS/GRAFICOS, mas os
// testes do dashboard partem dos dados mockados. Liga o mock explicitamente antes
// de cada teste (no código, ausente = dados reais); quem precisa do modo real faz
// vi.stubEnv(..., 'false') ou vi.stubEnv(..., undefined) no teste.
beforeEach(() => {
  vi.stubEnv('VITE_USE_MOCK_KPIS', 'true')
  vi.stubEnv('VITE_USE_MOCK_GRAFICOS', 'true')
  // O BroadcastChannel do Node alcança os outros arquivos de teste do mesmo
  // processo: o "logout" de um teste derrubaria a sessão de outro. Quem testa
  // as abas (SessaoEntreAbas.test.tsx) usa um canal simulado.
  vi.stubGlobal('BroadcastChannel', undefined)
})
afterEach(() => {
  server.resetHandlers()
  sessionStorage.clear()
  definirSessaoEmMemoria(null)
  limparAtividade()
  reiniciarCanal()
  // T42: o rascunho é salvo com debounce de 800 ms, mais que a duração de
  // muitos testes. Um salvamento que sobrevive ao fim do teste dispara durante
  // a limpeza do ambiente e aborta uma transação do IndexedDB, o que a suíte
  // reporta como erro não tratado mesmo com todos os testes passando.
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

// Filtros de lista vivem fora dos componentes e não podem vazar de um teste
// para outro. Os avisos não precisam de limpeza: são estado do ToastProvider,
// que morre junto com o unmount de cada teste.
afterEach(() => {
  limparFiltrosDeListas()
  limparToasts()
})

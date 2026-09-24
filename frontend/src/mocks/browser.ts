import { setupWorker } from 'msw/browser'
import { ocorrenciasHandlers } from './handlers'

// Login, troca de senha e CRUD de usuários (módulo usuarios), animais, baias
// e o clínico já existem de verdade no backend — para esses, o worker do dev
// bypassa (onUnhandledRequest: 'bypass' em main.tsx) e o request vai direto
// para a API real. `ocorrencias` (T28) ainda não tem backend (T25/T26), então
// o worker do dev mocka só esse módulo, reaproveitando os mesmos handlers dos
// testes automatizados (mocks/handlers.ts / mocks/server.ts). Ponto de
// extensão para o próximo módulo que nascer só mockado (ex.: processos).
export const worker = setupWorker(...ocorrenciasHandlers)

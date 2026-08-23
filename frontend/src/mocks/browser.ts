import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// Ativado só em dev (ver main.tsx) — nunca entra no bundle de produção.
// Permite testar o fluxo de login manualmente no navegador enquanto o
// backend real (T09) não existe. Credenciais mockadas: ver CREDENCIAIS_VALIDAS
// em mocks/handlers.ts.
export const worker = setupWorker(...handlers)

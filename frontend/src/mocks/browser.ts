import { setupWorker } from 'msw/browser'

// Login, troca de senha e CRUD de usuários (módulo usuarios) já existem de
// verdade no backend — o worker do dev sobe sem handlers e todo request passa
// direto para a API real (onUnhandledRequest: 'bypass' em main.tsx). Os
// handlers completos continuam em mocks/handlers.ts, usados só pelos testes
// automatizados (mocks/server.ts, ligado em test/setup.ts), que não sobem um
// backend Spring/Postgres de verdade.
// `ocorrencias` (T27/T28) não usa mais este worker — o mock desse módulo
// virou um store local em memória (ver
// features/ocorrencias/api/ocorrenciasMockStore.ts), sem service worker, depois
// que o MSW não interceptou de forma confiável em `npm run dev`.
// Mantido como ponto de extensão para mocks temporários de módulos futuros
// (processos, relatórios) enquanto não tiverem backend.
export const worker = setupWorker()

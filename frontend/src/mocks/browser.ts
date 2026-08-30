import { setupWorker } from 'msw/browser'

// Login, troca de senha e CRUD de usuários (módulo usuarios) já existem de
// verdade no backend — o worker do dev sobe sem handlers e todo request passa
// direto para a API real (onUnhandledRequest: 'bypass' em main.tsx). Os
// handlers completos continuam em mocks/handlers.ts, usados só pelos testes
// automatizados (mocks/server.ts, ligado em test/setup.ts), que não sobem um
// backend Spring/Postgres de verdade.
// Mantido como ponto de extensão para mocks temporários de módulos futuros
// (animais, ocorrências, processos, relatórios) enquanto não tiverem backend.
export const worker = setupWorker()

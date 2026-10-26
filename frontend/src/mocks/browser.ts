import { setupWorker } from 'msw/browser'

// Login, troca de senha e CRUD de usuários (módulo usuarios) já existem de
// verdade no backend — o worker do dev sobe sem handlers e todo request passa
// direto para a API real (onUnhandledRequest: 'bypass' em main.tsx). Os
// handlers completos continuam em mocks/handlers.ts, usados só pelos testes
// automatizados (mocks/server.ts, ligado em test/setup.ts), que não sobem um
// backend Spring/Postgres de verdade.
// Todos os módulos (inclusive relatórios, KPIs e gráficos) usam a API real;
// o worker fica sem handlers e só sobe em `vite dev` (main.tsx). Dados de
// teste manual vêm do seed do backend (perfil `seed`, ver README).
export const worker = setupWorker()

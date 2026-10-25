# Linha de base dos testes — antes do merge de `fix/ui-pos-revisao` (22/10/2026)

Commit da main: `b3ce1de` (igual a `origin/main` após `git fetch --all --prune` e `git pull --ff-only`).

| Suíte | Resultado | Evidência |
|---|---|---|
| Backend `./mvnw verify` (surefire + failsafe/Testcontainers) | BUILD SUCCESS: 230 unitários + 445 de integração, 0 falhas | `../analise_fase2/log_backend_verify.txt` (executado hoje, mesmo commit; nenhum arquivo de backend muda no merge, ver `git diff --name-only main...fix/ui-pos-revisao`) |
| Frontend `npm run build` | OK | `../analise_fase2/log_frontend_build.txt` |
| Frontend `npm test` | 83 arquivos, 498 testes: **492 ok, 6 falhas** (EXIT 1) | `linha_de_base_npm_test.txt` |

Falhas pré-existentes do frontend (não atribuíveis à Fase 3):
- `src/features/dashboard/components/Dashboard.test.tsx` (3 testes)
- `src/features/dashboard/hooks/useDashboardKpis.test.tsx` (1)
- `src/features/graficos/components/GraficosDashboard.test.tsx` (1)
- `src/features/graficos/hooks/useGraficos.test.tsx` (1)

Causa: os testes assumem o modo mock dos KPIs/gráficos, mas `frontend/.env` define `VITE_USE_MOCK_KPIS=false` e `VITE_USE_MOCK_GRAFICOS=false`; o MSW recusa `/api/dashboard/kpis|graficos`.

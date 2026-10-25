# Navegação pós-merge — todas as telas × três perfis (22/10/2026)

Ambiente: frontend `npm run dev` em `http://localhost:5173` (código da branch `alinhamento-tg` após o merge de
`fix/ui-pos-revisao`), backend do `docker compose` reconstruído com o código atual (V1–V24) e banco de desenvolvimento
local recriado do zero + `seed_demo.py` (dados fictícios). Automação: Playwright via `npx` em pasta temporária fora do
projeto (`%TEMP%\siszoo-pw\navegar.mjs`), viewport 1366×768. Para cada rota foram registradas respostas HTTP ≥ 400 da API,
requisições falhas, erros de console e `pageerror`.

## Resultado

| Perfil | Rotas visitadas | Redirecionadas pelo guard (esperado) | Chamadas de API com erro | Erros de console |
|---|---|---|---|---|
| Administrador | 16 + detalhes | nenhuma | **0** | **0** |
| Veterinário (Mariana Souza, fictícia) | 16 + detalhes | `/ocorrencias`, `/ocorrencias/novo`, `/usuarios`, `/logs` → `/dashboard` | **0** | **0** |
| Agente Sanitário (Carlos Pereira, fictício) | 16 + detalhes | `/animais/novo` → `/animais`; `/baias`, `/usuarios`, `/logs` → `/dashboard` | **0** | **0** |

Rotas: `/dashboard`, `/alertas/vacinas`, `/animais`, `/animais/novo`, `/animais/:id`, `/medicamentos`, `/baias`,
`/ocorrencias`, `/ocorrencias/novo`, `/processos`, `/processos/novo`, `/relatorios`, `/perfil`, `/configuracoes`,
`/usuarios`, `/logs`, rota inexistente (`EmConstrucao`). Login e troca de senha de primeiro acesso exercitados pelo seed.

## Telas que chamam endpoints inexistentes

**Nenhuma.** Todas as chamadas do frontend após o merge apontam para endpoints existentes. Os sete arquivos de
`docs/contratos/` trazidos pela branch são *pedidos* de filtro/agregação com fallback no cliente, não chamadas a rotas
ausentes:

| Contrato | Situação no backend após a Fase 3 |
|---|---|
| `auditoria-filtros.md` | **Atendido** (F2-027): `GET /api/auditoria?acao=&entidade=&usuarioEmail=&modulo=&de=&ate=`, `payloadAntes/Depois` no DTO e `GET /api/auditoria/filtros`; tela `/logs` ligada aos filtros do servidor. |
| `dashboard-kpis.md`, `dashboard-graficos.md` | Já implementados (T38). |
| `ocorrencias-filtro-data.md` | Aprovado pelo autor para depois da prioridade 2 (filtro de período em `GET /api/ocorrencias`). |
| `processos-filtro-urgente.md` | Pedido não bloqueante (card do dashboard usa `tamanho=50` + filtro local). Registrado em `bloqueios.md` como melhoria. |
| `ocorrencias-resumo-endereco.md` | Pedido não bloqueante (sugestão de endereço). Registrado em `bloqueios.md` como melhoria. |
| `distribuicao-ocorrencias-bairro.md` | Pedido não bloqueante (gráfico agrega no cliente até 500). Registrado em `bloqueios.md` como melhoria. |

## Observações do ambiente

- O container de backend que estava em execução era de uma imagem antiga; o banco local tinha as migrations V20/V21 da
  branch de e-mail antes da renumeração (checksums divergentes). Com autorização do autor, o database `siszoo` local foi
  recriado do zero (dados de seed, recriáveis).
- O seed oficial do projeto (`npm run db:seed`, `scripts/seed-test-data.mjs`) falha num banco com a V21: tenta
  retificar um resultado positivo, que a trigger `tg_resultado_positivo_definitivo` recusa — registrado em
  `pendencias_novas.md`. Por isso as capturas usam `capturas/seed_demo.py` (API REST, dados fictícios).
- Arquivos brutos da navegação: `%TEMP%\siszoo-pw\nav_admin.json` e `nav_perfis.json` (fora do repositório).

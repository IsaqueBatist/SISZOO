# Integração frontend ↔ API — inventário de mocks e rastreabilidade

Status: **auditado em 25/10/2026** (branch `feat/dados-reais-seed`). Atualize ao incluir uma tela, endpoint ou mock.

## Como o frontend fala com a API

- **Cliente único:** `frontend/src/lib/http.ts`, uma instância axios.
  - URL base: `VITE_API_BASE_URL` + `/api` (`lib/env.ts`).
  - Interceptor de requisição: `Authorization: Bearer`.
  - Interceptor de resposta: 401 → evento `auth:unauthorized` → logout e volta ao login (`AuthContext`); falha de rede →
    aviso de conexão.
- **Erros:** `lib/erroApi.ts` traduz a mensagem de regra (409/422) e os erros por campo (422) para o formulário.
- **Estado de servidor:** React Query (`lib/queryClient.ts`); cada feature tem os seus hooks `use*Query`/`use*Mutation`.
  As telas mostram carregando (skeleton), vazio, erro com "Tentar novamente" e sem permissão (rotas e menu por perfil;
  o backend responde 403 de qualquer forma).
- **Autorização:** sempre no backend (`@PreAuthorize` + `PreAutorizacaoInterceptor`, sigilo em `PermissoesOcorrencia`).
  O perfil do front só decide o que mostrar.

## Inventário de mocks (estado final)

### 1. Mocks e fixtures exclusivos dos testes (mantidos)

| Onde | Uso |
|---|---|
| `frontend/src/mocks/handlers.ts`, `*Handlers.ts`, `*Fixtures.ts`, `server.ts` | MSW nos testes do Vitest (`test/setup.ts`). Nenhum código de produção importa `src/mocks/`. |
| `frontend/src/mocks/browser.ts` + `main.tsx` | Worker do MSW **sem handlers**, só em `vite dev`; toda requisição vai para a API real. |
| Mockito nos `*Test` do backend | Testes unitários de service. Os `*IT` usam PostgreSQL real (Testcontainers). |

### 2. Dados fictícios persistidos no banco (desenvolvimento)

| Onde | Uso |
|---|---|
| `backend/src/main/java/com/siszoo/seed/` | Seed Java pelos services reais, com perfil `seed` + `SISZOO_SEED_HABILITADO=true`; nunca com `docker`/`prod` (`docs/decisoes/seed-dev.md`). Substitui o `scripts/seed-test-data.mjs`, removido. |
| `usuarios/DataSeeder.java` | Admin inicial (`ADMIN_SEED_*`). |

### 3. Dados estáticos legítimos de interface (mantidos)

Opções de enumeração e formulário (`animalFormSchema`, `processosCatalogos`, `TIPOS_/STATUS_OCORRENCIA`), rótulos e
cores (`statusBadge`, `historicoLabels`, `coresDoenca`, `coresEspecie`), perfis e menu (`lib/nav.ts`), temas, ícones dos
relatórios e o selo `SeloDadosMock`.

**Opt-in de desenvolvimento.** `VITE_USE_MOCK_KPIS` e `VITE_USE_MOCK_GRAFICOS` só ligam dados de demonstração no
dashboard com o valor exato `"true"` no build:
- ausente ou qualquer outro valor = dados reais, e o chunk do mock é podado do bundle;
- quando ligado, todos os cards, o painel de alertas e os gráficos mostram o selo "Dados de demonstração".

### 4. Mocks indevidos no fluxo de produção — **nenhum**

Itens encontrados na auditoria e o que foi feito:

| Prioridade | Onde estava | O que era | Resolução |
|---|---|---|---|
| Crítica | `dashboardApi.ts` + `dashboardApi.mock.ts` | Card "Adoções no Mês" sempre mockado (`{noMes: 8, metaMensal: 12}`) | `adocoes {adotados, disponiveis}` real em `GET /api/dashboard/kpis` (snapshot por status); card "Animais Adotados" |
| Alta | `lib/nav.ts` (`badge: 4`) | Contador fixo de ocorrências no menu | Contagem real (`GET /ocorrencias?status=ABERTA&tamanho=1` → `totalItens`), só para quem vê o módulo; atualizada após criar, editar, atender e encerrar |
| Média | `Topbar.tsx` | Busca global sem ação | Removida (limitação no README) |
| Média | `dashboardApi.ts::kpisUsamMock` | Com o opt-in ligado, KPIs mostravam ficção sem selo | Selo em todos os cards e nos alertas |
| Média | `animais/utils/catalogoClinico.ts` | Cópia do catálogo de vacinas e de tipos de procedimento | `vacinas` e `tiposProcedimento` em `GET /api/animais/catalogos`; modais com carregando, erro e vazio |
| Baixa | `CardRelatorio.tsx`, `PreviewAnualProcessos.tsx` | Textos prometendo métricas inexistentes | Corrigidos |
| Baixa | `lib/nav.ts` | Cargo desconhecido virava "agente" | Perfil `sem_perfil`, sem módulos |

**Bugs de integração corrigidos na auditoria:**
- **`Content-Disposition` não exposto no CORS:** o nome do arquivo exportado se perdia.
- **`mediaPorHora: null` à 0h:** o card mostrava "média null".
- **Contagens de ocorrência que ignoravam as não encerradas:** atingiam o KPI "registradas hoje" e o relatório
  Ocorrências por Bairro (INNER JOIN implícito no filtro de `registro_indevido`).

## Matriz de rastreabilidade

Todas as chamadas passam por `features/<módulo>/api/*.ts` → `lib/http.ts`. Os endpoints estão em
`backend/.../<módulo>/controller`, com `@PreAuthorize`. Status de todas as linhas: **validado**. O endpoint existe com o
mesmo método, caminho e parâmetros, os tipos TS batem com os records Java e há teste de integração.

| Funcionalidade | Tela | Serviço frontend | Endpoint | Persistência |
|---|---|---|---|---|
| Login / troca de senha | Login, TrocarSenha | `auth/api/authApi.ts` | `POST /auth/login`, `POST /auth/senha` | `usuario` |
| Usuários | Usuarios | `usuarios/api/usuariosApi.ts` | `GET/POST /usuarios`, `PATCH /usuarios/{id}/status` | `usuario`, `usuario_cargo` |
| Perfil e preferências | Perfil, Configuracoes | `perfil/api`, `configuracoes/api` | `GET/PATCH /usuarios/me`, `GET/PATCH /usuarios/me/preferencias` | `usuario`, `preferencia_usuario` |
| Auditoria | Logs | `auditoria/api/auditoriaApi.ts` | `GET /auditoria`, `GET /auditoria/filtros` | `auditoria_evento` |
| Animais | Animais, FichaAnimal, AnimalForm | `animais/api/animaisApi.ts` | `GET/POST /animais`, `GET/PUT /animais/{id}`, `GET /animais/catalogos` | `animal` + catálogos |
| Anexos do animal | AnexosAnimal | `animaisApi.ts` | `GET/POST /animais/{id}/anexos`, `GET .../{anexoId}` | `anexo_animal*` |
| Baias | GestaoBaias, BaiaFormModal | `animaisApi.ts` | `GET/POST /baias`, `PUT/DELETE /baias/{id}`, `PATCH /baias/{id}/status`, `GET /baias/residentes` | `baia` |
| Vacinação, procedimento, exame, prescrição | Abas da ficha + modais | `animais/api/historicoApi.ts` | `GET/POST /vacinacoes`, `/procedimentos`, `/exames`, `/prescricoes` | tabelas clínicas (imutáveis, V17) |
| Medicamentos e categorias | Medicamentos | `medicamentos/api`, `historicoApi.ts` | `GET/POST /categorias-farmacologicas`, `GET/POST /medicamentos` | `categoria_farmacologica`, `medicamento` |
| Alertas vacinais | AlertaVacinasDetalhe, Dashboard | `alertas/api/alertasApi.ts` | `GET /alertas/vacinas` | calculado |
| Ocorrências | Ocorrencias, OcorrenciaDetalhe, OcorrenciaForm | `ocorrencias/api/ocorrenciasApi.ts` | `GET/POST /ocorrencias`, `GET/PUT /ocorrencias/{id}`, `PATCH .../status`, `POST .../encerramento`, `POST .../notas`, `POST/GET .../anexos`, `GET /ocorrencias/catalogos`, `GET /ocorrencias/estatisticas/bairro` | `ocorrencia`, `denunciante`, `denunciado`, `movimentacao_ocorrencia`, `anexo_ocorrencia*` |
| Contador do menu | Sidebar | `ocorrenciasApi.ts` (`useOcorrenciasAbertasCount`) | `GET /ocorrencias?status=ABERTA&tamanho=1` | `ocorrencia.status_ocorrencia` |
| Processos sanitários | Processos, ProcessoDetalhe, ProcessoForm | `processos/api/processosApi.ts` | `GET/POST /processos`, `GET /processos/{id}`, `PATCH .../status`, `POST .../resultados`, `POST .../notificacoes/reenviar`, `GET /processos/catalogos`, `POST /ocorrencias/{id}/processo` | `processo_sanitario`, `responsavel_processo`, `animal_amostrado`, `resultado_processo` |
| Dashboard | Dashboard | `dashboard/api/dashboardApi.ts` | `GET /dashboard/kpis` | calculado (cache de 5 min) |
| Gráficos | GraficosDashboard | `graficos/api/graficosApi.ts` | `GET /dashboard/graficos` | calculado |
| Relatórios | Relatorios, PainelPreviewRelatorio, HistoricoRelatorios | `relatorios/api/relatoriosApi.ts` | `GET /relatorios/tipos`, `GET /relatorios/preview`, `POST /relatorios/exportar`, `GET /relatorios/historico` | `relatorio_gerado` |
| CEP | SecaoDenunciante, CamposResponsavel | `lib/viaCep.ts` | serviço externo ViaCEP | — |

**Notas da matriz:**
- **Endpoints sem tela:** `GET /health`, `GET` por id dos registros clínicos, de baia e de medicamento, e
  `PUT/DELETE /medicamentos/{id}` (não há edição de medicamento na interface).
- **Filtro de data das ocorrências:** são os parâmetros `de`/`ate` (`docs/contratos/ocorrencias-filtro-data.md`).
- **Pendência de regra:** `GET /ocorrencias/estatisticas/bairro` conta todo o histórico, inclusive `registro_indevido`,
  enquanto o KPI e o relatório excluem. É uma decisão de produto a confirmar.
- **Artefatos defasados:** `docs/tg/analise_fase2/mapa_codigo.md` e `matriz_rastreabilidade.csv` são da análise de
  22/10/2026 (antes da V23–V28 e das telas novas). Ficam como artefato do TG; esta é a matriz vigente.

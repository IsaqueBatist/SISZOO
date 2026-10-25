# Índice das capturas de tela — Fase 3

Geradas em 22/10/2026 a partir do ambiente de desenvolvimento local (docker compose: PostgreSQL + backend; frontend Vite em
`http://localhost:5173`), com Playwright executado via `npx` em pasta temporária fora do projeto (`%TEMP%\siszoo-pw\capturas.mjs`),
sem adicionar dependências ao repositório. Viewport 1366×768, escala 1, tema claro, `pt-BR`, fuso America/Sao_Paulo.

Dados **fictícios** (LGPD), carregados por `seed_demo.py` (esta pasta; não commitado no código do sistema): 7 usuários
(2 Administradores, 2 Veterinários, 3 Agentes Sanitários, um inativo), 11 baias (uma superlotada), 18 animais com histórico clínico
(vacinações vencidas e a vencer, procedimentos, prescrições, exames e anexo), 8 ocorrências (uma sigilosa, uma anônima, três urgentes,
duas encerradas), 6 processos sanitários (dois urgentes por contato humano, com GAL/SINAN em branco; resultados positivo,
negativo e inconclusivo) e 8 exportações de relatório.

Usuários da demonstração (senha `Demo@2026!`, só no ambiente local): `mariana.souza@itu.sp.gov.br` (Veterinária),
`carlos.pereira@itu.sp.gov.br` (Agente Sanitário) e o administrador do `.env` local (`ADMIN_SEED_EMAIL`). A mesma página autenticada
foi reutilizada para todas as telas de um perfil (a sessão fica em `sessionStorage`, por aba). Página inteira (`fullPage`) nas telas
longas; viewport nas demais e nos relatórios (rolados até o painel gerado).

| Código | Arquivo | Rota | Usuário / perfil | Dados exibidos | Figura destino |
|---|---|---|---|---|---|
| T01 | T01_login.png | /login | deslogado | Tela de login vazia (placeholders) | Figura 31 – Tela T01: Login |
| T02 | T02_dashboard.png | /dashboard | Administrador | KPIs (18 animais, 60 % vacinados, ocorrências do dia), 5 alertas, gráficos, processos urgentes | Figura 32 – Tela T02: Dashboard operacional |
| T03 | T03_alertas.png | /alertas/vacinas | Veterinário (Mariana Souza) | 6 vacinas em alerta: 3 vencidas, 3 a vencer em 7 dias | Figura 33 – Tela T03: Alertas |
| T04 | T04_animais.png | /animais | Veterinário | Lista de 18 animais com espécie, baia, status, porte, entrada | Figura 34 – Tela T04: Animais do canil |
| T05 | T05_cadastro_animal.png | /animais/novo | Veterinário | Etapa 1 do cadastro (microchip, data de implantação, medalha, procedência etc.) | Figura 35 – Tela T05: Cadastro de animal |
| T06 | T06_ficha_animal.png | /animais/{id de Thor} | Veterinário | Ficha de "Thor": identificação com medalha/implantação/procedência, abas clínicas, anexos | Figura 36 – Tela T06: Ficha do animal |
| T07 | T07_gestao_baias.png | /baias | Administrador | 11 baias por tipo (externa, gatil, interna), ocupação, Baia 5 superlotada | Figura 37 – Tela T07: Gestão de baias |
| T08 | T08_ocorrencias.png | /ocorrencias | Agente Sanitário (Carlos Pereira) | 8 ocorrências; gráfico por bairro; filtros tipo/status/período; denunciante "Sigiloso" e "Anônima" | Figura 38 – Tela T08: Ocorrências |
| T09 | T09_registro_ocorrencia.png | /ocorrencias/novo | Agente Sanitário | Formulário vazio (tipo, dados, denunciante, denunciado, anexos) | Figura 39 – Tela T09: Registro de ocorrência |
| T10 | T10_detalhe_ocorrencia.png | /ocorrencias/{id OC 002/2026} | Agente Sanitário | Ocorrência urgente em atendimento, com processo PS 001/2026 vinculado e movimentações | Figura 40 – Tela T10: Detalhe da ocorrência |
| T11 | T11_processos.png | /processos | Agente Sanitário | 6 processos, dois urgentes fixados no topo, filtros doença/status | Figura 41 – Tela T11: Processos sanitários |
| T12 | T12_abertura_processo.png | /processos/novo | Agente Sanitário | Etapa 1 (vínculo com ocorrência, doença, laboratório, Nº GAL, Nº SINAN) | Figura 42 – Tela T12: Abertura de processo |
| T13 | T13_detalhe_processo.png | /processos/{id PS 001/2026} | Agente Sanitário | Processo urgente com resultado, amostra, responsável, GAL/SINAN "—" | Figura 43 – Tela T13: Detalhe do processo |
| T14 | T14_central_relatorios.png | /relatorios | Administrador | 6 cartões de relatório e histórico de 8 exportações | Figura 44 – Tela T14: Central de relatórios |
| T15 | T15_usuarios.png | /usuarios | Administrador | 7 usuários (um inativo) com cargo e status | Figura 45 – Tela T15: Usuários |
| T16 | T16_configuracoes.png | /configuracoes | Veterinário | Preferências de tema e densidade | Figura 46 – Tela T16: Configurações |
| T17 | T17_perfil.png | /perfil | Veterinário | Dados da conta, contato, permissões do cargo, atualização de telefone | Figura 47 – Tela T17: Perfil |
| T18 | T18_relatorio_anual_processos.png | /relatorios (preview) | Administrador | Relatório Anual de Processos 2026: 6 processos, 1 positivo, 2 com contato humano | Figura 60 – Tela T18: Relatório anual de processos |
| T19 | T19_relatorio_vacinacao.png | /relatorios (preview) | Administrador | Relatório de Vacinação (22/09–22/10/2026): 4 aplicadas, 60 % vacinados, 3 vencidas | Figura 61 – Tela T19: Relatório de vacinação |
| T20 | T20_relatorio_adocoes.png | /relatorios (preview) | Administrador | Relatório de Adoções: 1 animal adotado, aviso de escopo | Figura 62 – Tela T20: Relatório de adoções |
| T21 | T21_relatorio_procedimentos.png | /relatorios (preview) | Administrador | Relatório de Procedimentos: 12 procedimentos, por tipo | Figura 63 – Tela T21: Relatório de procedimentos |
| T22 | T22_relatorio_ocupacao_baias.png | /relatorios (preview) | Administrador | Ocupação de Baias: 30 % média, 1 no limite, capacidade 50 | Figura 64 – Tela T22: Relatório de ocupação de baias |
| T23 | T23_relatorio_ocorrencias_bairro.png | /relatorios (preview) | Administrador | Ocorrências por Bairro: 2 ocorrências, 2 bairros, 100 % encerradas | Figura 65 – Tela T23: Relatório de ocorrências por bairro |

Atualização de 23/10/2026 (Fase 4): T14 e T18–T23 foram recapturadas em **1920×1080** (viewport; 4 cartões de KPI lado a lado),
com o banco de desenvolvimento populado pelo seed oficial do projeto (`npm run db:seed`; usuário Administrador do `.env`) — os
números dessas sete telas, portanto, diferem dos das demais (seed de demonstração). T23 usou o período 19–23/10/2026. No documento
final (`SISZOO_v3_final.docx`) as figuras do Apêndice E são 57–62 e as do Anexo A 63–66 (três fotos do Apêndice D removidas).

Observações:

- As Figuras 49–54 do Apêndice E foram renumeradas para 60–65 no documento alinhado (duplicavam as Figuras 49–54 do Apêndice D);
  o Anexo A passou de 60–63 para 66–69.
- Inspeção visual feita em todas as 23 imagens: sem cortes, sem erros na tela, sem esqueletos de carregamento. Durante a inspeção
  foram corrigidos no código a grade da Central de Relatórios (transbordava a 1366 px) e o período padrão dos relatórios
  (virava o dia em UTC) — commit `712f7f1`.
- Quadro 15 conferido: perfis de T04, T07, T11–T13 e o nome de T17 ("Perfil") foram ajustados no texto do documento, conforme o código.

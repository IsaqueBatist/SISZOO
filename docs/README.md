# Documentação — SISZOO

Documentação de análise, modelagem e decisões do sistema, derivada do protótipo navegável, da entrevista com a equipe
do CCZ-Itu (09/01/2026) e do que foi implementado. **Fonte de verdade, nesta ordem:** código em `main` (migrations
`backend/src/main/resources/db/migration`, V1–V28) → `DER.md` → decisões → documento do TG. Se algo divergir, o código
manda e a documentação é corrigida no mesmo PR (checklist abaixo, em "Como manter").

## Conteúdo

| Arquivo / pasta | O que é |
|---|---|
| `DER.md` | Diagrama Entidade-Relacionamento completo: entidades, atributos, relacionamentos, catálogos, estado do schema por migration e as regras de negócio numeradas (§5). Referência central do modelo de dados. |
| `modulo1-usuarios-acesso.dbml` … `modulo5-relatorios.dbml` | Diagramas lógicos por módulo, em DBML (espelham as migrations; tabelas só modeladas trazem `Note: 'modelo-alvo…'`). |
| `decisoes/` | Uma linha por decisão, por task: `T25-T26.md` (ocorrências, sigilo), `T29.md` (processos), `T34.md` (resultado laboratorial), `T35.md` (e-mail), `T37.md` (notificação), `T42.md` (rascunho offline), `T43.md` (auditoria), `animais-clinico-correcoes.md`, `auditoria-rn.md`, `pendencias-auditoria-rn.md`, `ficha-completa-seed-fuso.md`, `politica-senha.md`, **`alinhamento-tg.md`** (decisões AT-1…AT-21 do alinhamento com o TG, 22–24/10/2026), `seed-dev.md` (seed de dados fictícios: guardas, idempotência, massa). |
| `integracao-frontend-api.md` | Inventário de mocks (teste, seed, estáticos legítimos, indevidos) e matriz de rastreabilidade tela → serviço → endpoint → tabela. |
| `contratos/` | Pedidos do frontend ao backend e contratos de endpoints, cada um com `Status:` na primeira linha (implementado/pendente). |
| `regras-negocio-clinico.md` | Regras de vacinação, procedimento, prescrição, exame, anexos do animal, datas e ficha completa; alerta vacinal. |
| `email.md` | Serviço de e-mail (T35): variáveis SMTP, sandbox, GreenMail, templates, notificação de resultado e reenvio. |
| `roteiro-testes-manuais.md` | Roteiro de teste manual (tela, API e banco) por área, inclusive o alinhamento com o TG. |
| `insomnia/README.md` | Como abrir a coleção do Insomnia (`.insomnia/` na raiz) com os endpoints e suítes de regras. |
| `pendencias-documentacao.md` | Divergências conhecidas entre documentação e código, abertas e resolvidas. |
| `entrevista_09jan2026.md` | Registro da entrevista de levantamento de requisitos com a equipe do CCZ. |
| `planilha_animais.md`, `planilha_processos.md` | Estrutura das planilhas Excel atuais (legado substituído). |
| `prototipo/` | Protótipo navegável (HTML/CSS/JS) e design system; base visual das telas. |
| `tg/` | Trabalho de Graduação: versões do documento (binários fora do git), análises das fases 1–4, capturas das telas, diagramas PlantUML e scripts. Índice em `tg/README.md`. |

## Diagramas lógicos (DBML)

Os `modulo*.dbml` usam a sintaxe **DBML**. Para visualizar, cole o conteúdo em https://dbdiagram.io.

| Módulo | Arquivo | Tabelas implementadas | Só modeladas (trabalho futuro) |
|---|---|---|---|
| 1 — Usuários & Acesso | `modulo1-usuarios-acesso.dbml` | usuario, cargo, usuario_cargo, cargo_permissao, preferencia_usuario, auditoria_evento | — |
| 2 — Animais e clínico | `modulo2-animais.dbml` | especie, status_animal, motivo_entrada, tipo_baia, baia, animal, vacina, vacinacao, tipo_procedimento, procedimento, categoria_farmacologica, medicamento, prescricao, tipo_exame, exame, anexo_animal (+conteúdo) | adocao, vacina_especie, animal_sintoma, anexo_vacinacao, anexo_procedimento, anexo_exame |
| 3 — Ocorrências | `modulo3-ocorrencias.dbml` | protocolo_sequencia, tipo_ocorrencia, providencia_tomada, ocorrencia, denunciante, denunciado, movimentacao_ocorrencia, anexo_ocorrencia (+conteúdo) | — |
| 4 — Processos Sanitários | `modulo4-processos.dbml` | doenca, laboratorio, sintoma, resultado_laboratorial, desfecho_animal, processo_sanitario, responsavel_processo, animal_amostrado, amostra_sintoma, resultado_processo | documento_processo, tipo_documento_processo |
| 5 — Relatórios | `modulo5-relatorios.dbml` | relatorio_gerado (dashboard e alertas são computados, sem tabela) | — |

## Documento do TG

- Entregue em 23/10/2026: `tg/SISZOO_v3_final.docx` (e `.pdf`), fora do git. A linha de base (`SISZOO_versao_limpa.docx`)
  nunca é editada.
- O documento foi alinhado ao código em quatro fases (auditoria interna → rastreabilidade com 629 itens → execução das
  decisões no código e no texto → versão final ABNT). Relatórios, matriz, bloqueios e pendências em `tg/analise_fase1`,
  `tg/analise_fase2` e `tg/analise_fase3`; decisões consolidadas em `decisoes/alinhamento-tg.md`.
- Regra: o TG descreve o sistema; nunca altere o sistema para "bater" com o texto sem decisão registrada. O que não
  está implementado aparece no TG como "modelado; implementação prevista em trabalhos futuros" ou como limitação.

## Como manter

Ao implementar entidade, endpoint, regra ou tela: (1) compare com `DER.md` e não invente campos; (2) se faltar algo na
modelagem, atualize `DER.md` e o DBML **primeiro**, depois o código; (3) registre a decisão em `decisoes/<task>.md`
(nova linha "Revisão de DD/MM/AAAA" quando mudar algo já decidido); (4) ajuste o `Status:` do contrato atendido;
(5) anote em `tg/analise_fase3/pendencias_novas.md` o que o TG precisa refletir; (6) acrescente o passo manual ao roteiro
quando a regra é visível na tela. Nunca versione dados pessoais reais (LGPD) — só dados fictícios em exemplos e seeds.

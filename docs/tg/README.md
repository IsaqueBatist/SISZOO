# docs/tg — Trabalho de Graduação (documento e análise de alinhamento)

Material do TG do SISZOO (FATEC Itu, ADS 2026). Os textos, scripts, capturas e diagramas são versionados;
os binários do documento (`.docx`, `.pdf`) e a pasta `build/` ficam **fora do git** (`.gitignore`) e vivem na
máquina dos autores — quem precisar deles pede a um dos autores.

## Versões do documento (não versionadas)

| Arquivo | O que é | Pode editar? |
|---|---|---|
| `SISZOO_versao_limpa.docx` | Texto original entregue à análise (22/10/2026, antes de qualquer correção). | **Nunca.** É a linha de base. |
| `SISZOO_v2_alinhado.docx` | Original + 301 alterações **controladas** (autor "Revisão SISZOO") que alinham o texto ao código; capturas inseridas. | Só para consultar o que mudou. |
| `SISZOO_v3_final.docx` | **Versão entregue.** Alterações aceitas, capturas 1920×1080 dos relatórios, descrições detalhadas das telas, Apêndice D sem fotos repetidas, ABNT (numeração a partir da Introdução, legendas e listas automáticas). | Sim — é o documento vivo. |
| `SISZOO_v3_final.pdf` | Exportação do Word para conferência. | Regenerar a partir do `.docx`. |

## Pastas

| Pasta / arquivo | Conteúdo |
|---|---|
| `analise_fase1/` | Auditoria interna do documento (texto × quadros × diagramas): `relatorio_fase1_analise_documental.md`, `achados_fase1.csv` (67 achados F1-xxx), `inventario_especificacao.json` (RFs, RNs, UCs, entidades, telas), `texto/` (documento em markdown + `blocos.json`), `quadros/` (94 quadros em CSV), `figuras/` (mapeamento figura→imagem, transcrições dos diagramas). |
| `analise_fase2/` | Rastreabilidade documento × código no commit `b3ce1de`: `matriz_rastreabilidade.csv` (629 linhas, com `decisao_autor`/`observacao_autor` preenchidos), `relatorio_fase2.md`, `mapa_codigo.md`, `decisoes_pendentes.md`, `schema_migrations.json`, `scripts/`. |
| `analise_fase3/` | Execução das decisões (código + documento), 22/10/2026: `relatorio_fase3.md`, `bloqueios.md` (B-01…B-14, D-01, D-02), `pendencias_novas.md` (N-01…N-13), `log_alteracoes_documento.md` (v2), `log_alteracoes_fase4.md` (v3), `relatorio_fase4.md` (P4-01…P4-08), `linha_de_base_testes.md`, `navegacao_pos_merge.md`, `contagem_testes.json`, `diagramas_para_revisar.md`. |
| `analise_fase3/capturas/` | 23 capturas reais das telas (T01–T23), `capturas_indice.md` (rota, perfil, dados, figura destino), `seed_demo.py` (dados **fictícios** carregados pela API para as capturas; não é o seed do produto). |
| `analise_fase3/diagramas/` | Fontes PlantUML (`.puml`) e PNG dos diagramas lógicos M1–M5 e das enumerações, fiéis às migrations V1–V26. As figuras 7–25 do `.docx` ainda são as originais. |
| `analise_fase3/scripts/` | `docx_kit.py` (edição OOXML com controle de alterações), `docx_final.py` (edições diretas, SEQ, seções, cabeçalho), `editar_docx.py` (gera a v2), `aceitar_revisoes.py` → `finalizar_docx.py` → `concluir_docx.py` (geram a v3; os dois de ponta usam o Word por automação), `registrar_decisoes.py`. |
| `build/` (ignorada) | Intermediários da v3 (`v3_aceito.docx`, `v3_campos.docx`, `v3_trabalho.docx`). |

## Como regenerar

1. **Capturas**: ambiente local (`docker compose up` ou backend + `npm run dev` em `localhost:5173`, única origem aceita
   pelo CORS), banco com dados fictícios (`seed_demo.py` ou `npm run db:seed`), Playwright via `npx` em uma pasta
   **fora do repositório** (o projeto não depende de Playwright): `capturas.mjs` (cópia de referência em
   `analise_fase3/capturas/`, se existir) com `SOMENTE=T14,T18` para refazer só algumas. Telas em 1366×768;
   relatórios (T14, T18–T23) em 1920×1080, viewport rolada até o painel gerado. Tema claro, dados fictícios, sem spinner.
2. **Documento**: nunca edite a `versao_limpa`. Para uma nova rodada de alinhamento, parta da `v3_final` (ou da última
   versão), edite com o Word ou com o `docx_final.py`, e feche com o Word (`concluir_docx.py`: atualiza SEQ, Sumário,
   listas; salva `.docx` e `.pdf`). Legendas são campos `SEQ Figura`/`SEQ Quadro`; Sumário e listas são campos `TOC`.
3. **Diagramas**: `java -jar plantuml.jar -charset UTF-8 -tpng analise_fase3/diagramas/*.puml` (PlantUML baixado
   avulso; layout Smetana, sem Graphviz).

## Regras ao mexer no TG

- O texto do documento deve ser **fiel ao código em `main`**: o que não está implementado aparece como "modelado;
  implementação prevista em trabalhos futuros" (adoção, documento do processo, anexos por registro clínico) ou como
  limitação (`data_saida`, e-mail à Vigilância Epidemiológica, testes E2E).
- Decisões de produto tomadas durante o alinhamento estão em `docs/decisoes/alinhamento-tg.md`; o que ficou em aberto,
  em `analise_fase3/bloqueios.md`, `analise_fase3/pendencias_novas.md` e `analise_fase3/relatorio_fase4.md`.
- Toda mudança de código que altera RF, RN, tela ou schema gera pendência para o documento (ver `docs/CLAUDE.md`).

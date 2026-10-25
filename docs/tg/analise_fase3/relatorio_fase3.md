# Relatório da Fase 3 — Alinhamento código × documento (SISZOO)

Data: 22/10/2026. Branch `alinhamento-tg` (base: `main` após merge de `fix/ui-pos-revisao`; tag `pre-alinhamento-tg` = `b3ce1de`).
Nada foi enviado ao remoto (sem push). Documento de trabalho: `docs/tg/SISZOO_v2_alinhado.docx`; o original
`docs/tg/SISZOO_versao_limpa.docx` está intacto (não aberto para escrita; data de modificação 22/10/2026 10:13).

## Resumo executivo

- **Git**: tag `pre-alinhamento-tg`; merge `--no-ff` da branch de frontend (`f3cad58`, 11 conflitos resolvidos: dashboard com a
  versão da `main`, demais combinados); linha de base de testes registrada antes do merge (`linha_de_base_testes.md`, com as
  6 falhas de ambiente do `npm test`). Navegação pós-merge em três perfis: nenhuma tela chama endpoint inexistente
  (`navegacao_pos_merge.md`); os três contratos pendentes de `docs/contratos/` ficaram como melhorias (B-07 a B-09).
- **Código** (9 commits em `alinhamento-tg`, cada um citando os IDs da matriz):
  - P1 — `e3aff1f`: resultado Inconclusivo também notifica o munícipe (F2-014, RN10), auditoria de animais e baias
    (F2-029, F2-078), acesso do Agente ao denunciante sigiloso mantido e auditado (F2-059).
  - P2 — `02ce504` (F2-004/F2-008: `numero_medalha`, `data_implantacao_chip`, `procedencia`, laudo de eutanásia só na
    transição para óbito por eutanásia; V23/V24), `8f92653` (F2-027: filtros de servidor na trilha de auditoria e tela de Logs),
    `67ed07f` (F2-012/045/087: GAL e SINAN na abertura do processo), `57014a0` (RF-A04: exames e anexos do animal; V25/V26).
  - P3 e filtro de período — `6fe5c9e` (F2-010: `de`/`ate` nas ocorrências), `9886c62` (testes neutralizam `.env` local),
    `712f7f1` (grade da Central de Relatórios sem transbordar a 1366 px; período padrão no fuso do CCZ).
  - Nenhuma migration existente foi editada; `.env` e credenciais intactos; nenhum banco real foi usado.
  - **Testes finais**: backend `mvnw verify` verde — 230 unitários + 474 de integração, 0 falhas; frontend 593/593;
    `npm run build` OK (`contagem_testes.json`).
- **Capturas**: 23 PNG reais (T01–T23) em `capturas/`, dados fictícios por `seed_demo.py` (não commitado no código), Playwright
  via `npx` fora do projeto, viewport 1366×768, tema claro; todas inspecionadas (sem cortes, erros ou spinners);
  `capturas_indice.md` com rota, perfil, dados e figura destino. Duas correções de layout/data encontradas na inspeção foram
  feitas no código (commit `712f7f1`).
- **Documento** (`SISZOO_v2_alinhado.docx`, gerado por `scripts/editar_docx.py` + `scripts/docx_kit.py`): **301 operações**,
  todas como controle de alterações (autor "Revisão SISZOO"; 525 revisões no Word) — 23 figuras inseridas no lugar dos
  placeholders (tabela de figura no padrão do documento, ≤ 16 cm de largura e ≤ 20 cm de altura, legenda e "Fonte:" mantidas);
  Quadros 4–15 e 17–51 (RFs, RNFs, RNs, telas, casos de uso), Quadros 57, 67, 69, 70, 72, 75–77, 84–86, 89, 90, 92, 94 (dicionário)
  e seções 2.2, 2.3, 3.5.2, 4 (intro), 4.3, 4.4, 5.1, 5.2, Apêndice E e Considerações Finais reescritos conforme o código; novo
  RF-C04 (trilha de auditoria); Quadro 14 com MapStruct, Caffeine, react-hook-form, ViaCEP e IndexedDB nativo, Playwright como
  trabalho futuro; Quadro 15 com perfis reais e telas T24–T26; notas "modelado; implementação prevista em trabalhos futuros"
  nos Quadros 63, 68, 71, 73, 78, 79, 88, 91 (adoção, documento do processo e anexos por registro mantidos na modelagem);
  `Animal.data_saida` como limitação; Vigilância Epidemiológica como pendência em RN10, UC "Registrar Resultado Laboratorial"
  e Considerações Finais. ABNT: Figuras 49–54 do Apêndice E renumeradas para 60–65 e Anexo A para 66–69 (travessão),
  Lista de Figuras corrigida (48–55) e completada (56–69), `w:updateFields` para o Sumário. Log completo em
  `log_alteracoes_documento.md`. O `.docx` abre no python-docx e no Microsoft Word (186 páginas; PDF temporário inspecionado).
- **Diagramas**: 6 fontes PlantUML fiéis ao código (lógicos M1–M5 e enumerações) renderizadas em PNG em `diagramas/`;
  imagens do `.docx` não trocadas, conforme a regra (`diagramas_para_revisar.md`).
- **Pendências e bloqueios**: `bloqueios.md` (B-01 a B-14, D-01, D-02) e `pendencias_novas.md` (N-01 a N-13). Sem
  "[CITAÇÃO NECESSÁRIA]" e sem referências novas.

## Rastreabilidade das decisões dos autores

| Decisão | Aplicação |
|---|---|
| F2-004 Opção A | 3 campos implementados (V23, DTOs, formulário, ficha, testes `AnimalIdentificacaoLaudoIT`); Quadros 7, 23, 67 e Seção 5.2 atualizados. |
| F2-008 só o laudo | `laudo_eutanasia` (V24) exigido apenas na transição para `obito_eutanasia`; adoção mantida como modelagem (Quadros 7, 11, 25, 26, 79 com notas); `data_saida` limitação (3.5.2, Quadro 67). |
| F2-014 Opção C | `ResultadosNotificaveis` = positivo + inconclusivo, reenvio permitido; Vigilância documentada como pendência (RN10, Quadro 42, Considerações Finais, 3.5.2). |
| F2-027 Opção A | Backend: `GET /api/auditoria` com filtros + `GET /api/auditoria/filtros`; tela de Logs ligada; RF-C04 e Quadro 22 atualizados. |
| F2-059 Opção B | Agente mantido com acesso auditado (permissão `denunciante_sigiloso`); RN03, RF-E02, Quadros 38, 84, 15 e Seção 2.2 atualizados; testes de auditoria existentes mantidos. |
| F2-065 Opção A | Matriz do código documentada em RN09, Quadro 4 e Quadro 15 (T04, T07, T11–T13). |
| RF-A04 "execute" | Exames (`exame`, `tipo_exame`, imutáveis com `retifica_id`) e anexos do animal (`anexo_animal` + conteúdo, JPG/PNG/PDF, 5 MB, 10 por animal); Quadros 7, 32, 34, 69, 76, 77 e Seção 5.2 atualizados; anexos por registro clínico = trabalho futuro. |
| Trabalhos futuros (Playwright, adoção, documento do processo) | Não implementados; retirados do apresentado como implementado (Quadros 5, 9, 14; cap. 5; status dos RFs); mantidos na modelagem com nota; Considerações Finais; código parcial existente registrado em D-01. |
| Filtro de período (ocorrências) | Implementado após P2 (`6fe5c9e`), RF-E02/Quadro 38 atualizados. |

## Verificação final

- Build e testes: backend verde (230 + 474), frontend 593/593, build OK.
- `git status`: árvore limpa exceto `docs/tg/` (não versionado, como nas fases anteriores; contém o seed de demonstração e
  os artefatos do TG). `git log pre-alinhamento-tg..HEAD`: merge + 9 commits.
- `SISZOO_versao_limpa.docx` não modificado; `SISZOO_v2_alinhado.docx` validado (XML bem formado, python-docx, Word).
- Placeholders "[INSERIR CAPTURA ...]": 0 restantes (os 23 estão como texto excluído no controle de alterações).

## Saídas

- `docs/tg/SISZOO_v2_alinhado.docx`
- `docs/tg/analise_fase3/`: `relatorio_fase3.md`, `log_alteracoes_documento.md`, `bloqueios.md`, `pendencias_novas.md`,
  `diagramas_para_revisar.md`, `diagramas/*.puml|png`, `capturas/*.png`, `capturas/capturas_indice.md`, `capturas/seed_demo.py`,
  `linha_de_base_testes.md`, `navegacao_pos_merge.md`, `contagem_testes.json`, `scripts/` (`docx_kit.py`, `editar_docx.py`,
  `registrar_decisoes.py`); matriz da Fase 2 com `decisao_autor`/`observacao_autor` preenchidos.

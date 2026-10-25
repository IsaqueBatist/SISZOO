# Diagramas para revisar — Fase 3 (22/10/2026)

As figuras do TG não foram trocadas no `.docx` (sem fontes `.puml`/`.dbml` que gerem as imagens originais). Esta pasta traz
fontes PlantUML **fiéis ao código** (migrações Flyway V1–V26 e enums Java) renderizadas em PNG com PlantUML 1.2026.9
(layout Smetana, sem Graphviz), para os autores compararem com as figuras atuais e decidirem a substituição. O texto do
documento alinhado já não contradiz o código; onde o diagrama antigo diverge, o dicionário (Apêndice B) traz a nota.

| Fonte PlantUML | PNG | Figura(s) do TG que substitui | O que muda em relação à figura atual |
|---|---|---|---|
| `diagramas/logico_m1_usuarios_acesso.puml` | `logico_m1_usuarios_acesso.png` | Figura 12 (lógico M1); Figura 7 (DER M1) por consequência | Remove a entidade/tabela **Sessao** (autenticação stateless, V8); `auditoria_evento.entidade_id` (V9) e ação `VISUALIZACAO` (V12); `cargo_permissao.feature` (geral, denunciante_sigiloso); `preferencia_usuario` com as cinco notificações; `usuario.dois_fatores_ativo` reservado. |
| `diagramas/logico_m2_gestao_animais.puml` | `logico_m2_gestao_animais.png` | Figura 13 (lógico M2); Figuras 8, 18, 19, 20 por consequência | Catálogos `especie`, `status_animal`, `motivo_entrada`, `tipo_baia` como tabelas (FK), não enums; `animal` com `microchip`, `numero_medalha`, `data_implantacao_chip`, `procedencia`, `ficha_completa`, `laudo_eutanasia`, `data_entrada` timestamp e **sem `data_saida`**; `retifica_id` em vacinacao/procedimento/prescricao; **novas** `tipo_exame`, `exame`, `anexo_animal`, `anexo_animal_conteudo` (V25/V26). Não aparecem (só modeladas): `adocao`, `anexo_vacinacao`, `anexo_procedimento`, `anexo_exame`, `vacina_especie`, `animal_sintoma`. |
| `diagramas/logico_m3_ocorrencias.puml` | `logico_m3_ocorrencias.png` | Figura 14 (lógico M3); Figuras 9 e 22 por consequência | `protocolo_sequencia` (RN02); FK de `denunciante`/`denunciado` no filho (`ocorrencia_id` única); `ocorrencia.endereco`, `anonima`, `latitude/longitude`, `encerrada_por_id`; `movimentacao_ocorrencia.status_anterior/status_novo` e tipos reais; `anexo_ocorrencia.mime_type/tamanho/criado_por_id` + `anexo_ocorrencia_conteudo` (bytea); status sem AGUARDANDO_RETORNO. |
| `diagramas/logico_m4_processos.puml` | `logico_m4_processos.png` | Figura 15 (lógico M4); Figuras 10, 23, 24 por consequência | Catálogos `resultado_laboratorial` e `desfecho_animal` como tabelas; **nova** `resultado_processo` (histórico imutável, V14/V21); `responsavel_processo.processo_id` (1:1 com FK no filho, CPF sem UQ); `processo_sanitario.cid`, `data_notificacao_municipe`, status sem EM_ANDAMENTO e com COM_RESULTADO; `animal_amostrado` com `status_clinico`, sem `nome_animal` e sem `tipo_amostra`; enums de material biológico e nível de contato com os valores reais. Não aparecem (só modeladas): `documento_processo`, `tipo_documento_processo`. |
| `diagramas/logico_m5_relatorios.puml` | `logico_m5_relatorios.png` | Figura 16 (lógico M5); Figuras 11 e 25 por consequência | `relatorio_gerado` com `doc_id` (DOC-AAAA-NNNN) e sem `status`/`url_expira_em` (exportação síncrona, RN11). |
| `diagramas/enumeracoes_m2_m4.puml` | `enumeracoes_m2_m4.png` | Figuras 21 e 24 (enumerações) e, parcialmente, 17 e 22 | Valores reais de Sexo (com `nao_identificado`), Porte, Pelagem, StatusAnimal (catálogo, sem "Resgatado"), StatusProcesso, StatusClinicoAmostra, MaterialBiologico, NivelContato, TipoMovimentacaoOcorrencia, TipoRelatorio, SeveridadeAlerta; TipoAmostra, StatusDocumento e StatusRelatorio marcados como não implementados. |

Diagramas **não afetados** (sem fonte gerada nesta fase): Figuras 1–6 (casos de uso — só o texto dos quadros foi ajustado; o
UC "Consultar Trilha de Auditoria" passou a realizar o novo RF-C04 e os UCs "Registrar Adoção" e "Gerar Documento do Processo"
permanecem no diagrama como modelados) e Figuras 26–30 (protótipos). Os DER conceituais (Figuras 7–11) seguem válidos como
modelagem conceitual; as notas no texto indicam o que não foi implementado.

Como regenerar: `java -jar plantuml.jar -charset UTF-8 -tpng docs/tg/analise_fase3/diagramas/*.puml` (ou plantuml.com).
Os `.dbml` de `docs/` (fontes dos diagramas originais do dbdiagram.io) não foram alterados — ver pendência N-04.

# Relatório da Fase 2 — Rastreabilidade documento × código (SISZOO)

Data: 22/10/2026. Commit analisado: `b3ce1de` (branch main). Modo somente leitura: nenhum arquivo fora de `docs/tg/analise_fase2/` foi alterado. Especificação de referência: `docs/tg/analise_fase1/inventario_especificacao.json` (Fase 1). Mapa do código: `mapa_codigo.md`. Matriz completa: `matriz_rastreabilidade.csv` (UTF-8 com BOM, separador `;`). Decisões: `decisoes_pendentes.md`.

**Premissa de prazo** (o prompt deixou "[PREENCHER: DATA]"): entrega em 23/10/2026 (CLAUDE.md) / 25/10/2026 (Quadro 5, S9). Com um a três dias restantes, só mudanças de código de esforço **P** são consideradas viáveis; tudo o que é M/G foi recomendado como ATUALIZAR_DOC/REMOVER_DO_DOC ou deixado para DECISAO_AUTORES.

Convenção de esforço: estimativa em **código** para tornar o item conforme ao documento (P ≤ 0,5 dia; M 1–3 dias; G > 3 dias). Para REMOVER_DO_DOC, o esforço indica o custo de implementar, que justifica a remoção; para ATUALIZAR_DOC, P significa ajuste textual.

## 1. Resumo executivo

- Linhas na matriz: **629** — 558 itens do inventário da Fase 1 e 71 itens SÓ NO CÓDIGO.
- Conformidade estrita (CONFORME / itens do inventário): **63.1%** (352/558). Excluindo NÃO VERIFICÁVEL: 63.9%.
- Conformidade ampla (CONFORME + PARCIAL): **72.8%**.
- Itens funcionais (RF, UC, RN, RNF, perfis, relatórios, telas): 124 linhas, 52 CONFORME (41.9%).
- Build: backend `mvnw verify` **OK** (230 unitários + 445 integração, 0 falhas); frontend `npm run build` **OK**; `npm test` com 6 falhas de configuração de ambiente (492/498 ok) — ver §3.
- Mudanças de código recomendadas (ATUALIZAR_CODIGO/AMBOS): 5 itens, todos de esforço P (≈ 2.5 dias). Itens que dependem de decisão dos autores com opção de código: 7.

### 1.1 Totais por status

| Status | Linhas | % do total |
|---|---|---|
| CONFORME | 352 | 56.0% |
| PARCIAL | 54 | 8.6% |
| DIVERGENTE | 44 | 7.0% |
| SÓ NO DOCUMENTO | 101 | 16.1% |
| NÃO VERIFICÁVEL | 7 | 1.1% |
| SÓ NO CÓDIGO | 71 | 11.3% |

### 1.2 Totais por decisão recomendada

| Decisão | Linhas |
|---|---|
| ATUALIZAR_DOC | 514 |
| ATUALIZAR_CODIGO | 5 |
| AMBOS | 0 |
| REMOVER_DO_DOC | 91 |
| DECISAO_AUTORES | 19 |

### 1.3 Por módulo (linhas por status)

| Módulo | CONFORME | PARCIAL | DIVERGENTE | SÓ NO DOCUMENTO | NÃO VERIFICÁVEL | SÓ NO CÓDIGO | Total |
|---|---|---|---|---|---|---|---|
| M1 | 62 | 6 | 2 | 1 | 0 | 7 | 78 |
| M2 | 107 | 13 | 8 | 74 | 0 | 16 | 218 |
| M3 | 57 | 7 | 6 | 1 | 0 | 20 | 91 |
| M3/M4 | 0 | 0 | 1 | 0 | 0 | 0 | 1 |
| M4 | 58 | 14 | 10 | 20 | 0 | 10 | 112 |
| M5 | 17 | 6 | 5 | 3 | 0 | 4 | 35 |
| Geral | 50 | 8 | 12 | 2 | 7 | 14 | 93 |

### 1.4 Por categoria

| Categoria | CONFORME | PARCIAL | DIVERGENTE | SÓ NO DOCUMENTO | NÃO VERIFICÁVEL | SÓ NO CÓDIGO | Total | % CONFORME (inventário) |
|---|---|---|---|---|---|---|---|---|
| RF | 5 | 9 | 4 | 2 | 0 | 20 | 40 | 25.0% |
| UC | 12 | 11 | 9 | 4 | 0 | 0 | 36 | 33.3% |
| RN | 3 | 0 | 9 | 0 | 0 | 0 | 12 | 25.0% |
| RNF | 11 | 3 | 1 | 0 | 5 | 3 | 23 | 55.0% |
| Perfil | 5 | 0 | 0 | 0 | 0 | 1 | 6 | 100.0% |
| Relatório | 5 | 3 | 0 | 0 | 0 | 0 | 8 | 62.5% |
| Tela | 11 | 5 | 7 | 0 | 0 | 4 | 27 | 47.8% |
| Tecnologia | 28 | 0 | 4 | 2 | 2 | 6 | 42 | 77.8% |
| Enum | 11 | 2 | 10 | 3 | 0 | 3 | 29 | 42.3% |
| Entidade | 22 | 10 | 0 | 12 | 0 | 7 | 51 | 50.0% |
| Atributo | 239 | 11 | 0 | 78 | 0 | 27 | 355 | 72.9% |

### 1.5 Os 15 itens mais importantes

| # | ID | Item | Status | Decisão | Esforço | Risco | Síntese |
|---|---|---|---|---|---|---|---|
| 1 | F2-059 | RN03 Sigilo do Denunciante | DIVERGENTE | DECISAO_AUTORES | P | Alto | Mecanismo (mascaramento no backend + auditoria do acesso) está implementado e testado — resolve F1-010. Divergência: o Agente Sanitário também vê o denunciante sigiloso (seed V10), contrariando "nenhum perfil exceto Admi… |
| 2 | F2-014 | RF-B03 Resultado Laboratorial | DIVERGENTE | DECISAO_AUTORES | P | Alto | Dois desvios de uma RN crítica (RN10): (a) só Positivo notifica — decisão registrada no código ("Regra 19 (DER, revisão 2026-10-17)"), portanto mudança consciente → ATUALIZAR_DOC; (b) e-mail à Vigilância Epidemiológica é… |
| 3 | F2-008 | RF-A05 Entrada, Saída e Adoção | SÓ NO DOCUMENTO | DECISAO_AUTORES | G | Alto | A saída existe apenas como mudança de status (sem data, sem laudo, sem adotante). Adoção completa (tabela adocao + devolução) é esforço G → critério 3 (REMOVER_DO_DOC/Trabalhos futuros). O laudo de eutanásia é exigência … |
| 4 | F2-065 | RN09 Controle de Acesso | DIVERGENTE | DECISAO_AUTORES | P | Médio | Duas concessões a mais que RN09: Veterinário escreve em Processos Sanitários (abre processo, lança resultado) e Agente lê Gestão de Animais (precisa para vincular amostra a animal do canil e ver alertas). Ambas são justi… |
| 5 | F2-058 | RN02 Protocolo por Ano | DIVERGENTE | ATUALIZAR_DOC | P | Baixo | Formato real é NNN/AAAA (3 dígitos, crescendo acima de 999), confirmando os protótipos (F1-014) e o CLAUDE.md; sequência é POR ENTIDADE e por ano (ocorrência e processo não compartilham numeração). Concorrência garantida… |
| 6 | F2-007 | RF-A04 Histórico Veterinário | PARCIAL | REMOVER_DO_DOC | G | Médio | Vacinações, prescrições e procedimentos imutáveis com retificação e auditoria estão implementados e testados (critério 2: descrever o mecanismo retifica_id). Exames e anexos clínicos não existem e são esforço G (4 tabela… |
| 7 | F2-017 | RF-B06 Documento PDF | SÓ NO DOCUMENTO | REMOVER_DO_DOC | G | Baixo | Funcionalidade de prioridade Baixa, sem nenhuma implementação; fazê-la com fila de estados é G (entidade, geração assíncrona, armazenamento, tela). Critério 3: mover para Trabalhos futuros; remover RF-B06, Quadro 45, Qua… |
| 8 | F2-020 | RF-D02 Relatórios | DIVERGENTE | ATUALIZAR_DOC | P | Baixo | Os seis relatórios em PDF e CSV existem (resolve F1-038: não há Excel). O ciclo de estados e a URL com expiração não existem e a geração síncrona é adequada ao volume do CCZ (critério 2). Reescrever RF-D02, RN11, Quadros… |
| 9 | F2-068 | RN12 Ciclo do Processo | DIVERGENTE | ATUALIZAR_DOC | P | Baixo | EM_ANDAMENTO não existe e COM_RESULTADO foi acrescentado; o ciclo do código é coerente com o lançamento de resultado e testado (critério 2/5). A segunda frase da RN12 está conforme: exigirPrimeiroResultado (ProcessoSanit… |
| 10 | F2-004 | RF-A01 Cadastro de Animal | PARCIAL | DECISAO_AUTORES | M | Médio | Três atributos especificados (data de implantação do chip, número da medalha, procedência) não existem no código. Adicioná-los é esforço M (migration + entidade + DTOs + formulário + testes). Nenhum deles é exigido por R… |
| 11 | F2-078 | RNF10 Rastreabilidade | PARCIAL | ATUALIZAR_CODIGO | P | Médio | Edição de animal e de baia são alterações críticas (critério 1): adicionar auditoria nesses dois serviços é P (serviço pronto). IP é opcional (declarar não capturado). entidade_id existe (resolve F1-037). |
| 12 | F2-012 | RF-B01 Registro de Processo | PARCIAL | ATUALIZAR_CODIGO | P | Baixo | Números GAL e SINAN são o único vínculo com os sistemas estaduais citados em 3.5.2 ("apenas registro dos números") e o schema já os prevê: incluir os dois campos em CriarProcessoRequest/ProcessoSanitarioResponse e no for… |
| 13 | F2-029 | UC "Editar Dados do Animal" (Quadro 24) | DIVERGENTE | ATUALIZAR_CODIGO | P | Médio | Edição do cadastro do animal é "alteração crítica" pelo RNF10 e o UC exige ATUALIZACAO; acrescentar auditoria (antes/depois) em AnimalService.atualizar é P e usa o serviço existente. A imutabilidade do microchip é regra … |
| 14 | F2-027 | UC "Consultar Trilha de Auditoria" (Quadro 22) | PARCIAL | DECISAO_AUTORES | M | Médio | A trilha é gravada (RNF10) mas não é consultável pelo usuário. Tela simples + filtros é M. Autores decidem: implementar tela mínima ou documentar a consulta como "via banco/endpoint" e Trabalho futuro. Em qualquer caso, … |
| 15 | F2-193 | Entidade Sessao | SÓ NO DOCUMENTO | ATUALIZAR_DOC | P | Baixo | Resolve F1-023: a versão stateless (texto, dicionário, classes) é a do código. Remover Sessao do DER (Fig. 7) e do lógico (Fig. 12). |

### 1.6 Regras críticas (verificação dirigida)

| Regra | Resultado | Evidência |
|---|---|---|
| RN01 microchip único | CONFORME (índice único parcial; imutável após definido; data de implantação não existe) | V16; AnimalService.java:185-202 |
| RN02 protocolo NNN/AAAA com lock | DIVERGENTE só no formato (3 dígitos, sequência por entidade); concorrência OK | ProtocoloService.java:41-56; V10 protocolo_sequencia |
| RN03 sigilo no backend + auditoria do Admin | Mecanismo CONFORME; Agente também vê (DECISAO_AUTORES) | OcorrenciaMapper.java:28-31; OcorrenciaService.java:618; V10/V12 |
| RN04 contato humano → urgente | CONFORME | ProcessoSanitarioService.java:233-234 |
| RN06 imutabilidade + auditoria | CONFORME (retifica_id + triggers V14/V17 + AuditoriaEvento) | V6, V14, V17; VacinacaoService.java:115-118 |
| RF-A03 alerta 7 dias | CONFORME (aplicação + intervalo_meses; sob demanda, sem job) | AlertaVacinalService.java:30,46,85 |
| RN10 e-mail de resultado (destinatários exatos) | DIVERGENTE: só Positivo; Vigilância Epidemiológica apenas log mock | NotificacaoResultadoService.java:51,161-166 |
| RN05/RF-E03 bloqueio de encerramento | DIVERGENTE (mais estrito: processo CONCLUIDO) | OcorrenciaService.java:371-375 |
| RF-B05 conclusão sem resultado | CONFORME (todo processo) | ProcessoSanitarioService.java:414-419 |
| RNF06 JWT stateless | CONFORME (tabela sessao removida na V8) | SecurityConfig.java:39; V8 |
| RNF03 rascunho local | CONFORME (IndexedDB nativo) | rascunhoDb.ts:13-37 |
| E-mail institucional ^[a-z.]+@itu\.sp\.gov\.br$ | CONFORME | CriarUsuarioRequest.java:15 |
| RNF02 2 GB RAM / leveza | CONFORME por inferência (lazy, cache, paginação); não medido | AppRoutes.tsx; application.yml:55-58 |
| RNF07 navegadores | NÃO VERIFICÁVEL (sem E2E) | — |

## 2. Método e evidências

Etapa 0: mapa do código (`mapa_codigo.md`) com schema reconstruído das 22 migrations (`schema_migrations.json` via `scripts/parse_schema.py`). Etapa 1: cada item do inventário foi procurado no código (controller/service/DTO/migration/rota); linhas manuais em `scripts/dados_fase2_a.py` e `scripts/dados_fase2_b.py`; linhas de entidade/atributo geradas automaticamente por `scripts/gerar_fase2.py` comparando o dicionário (Quadros 52–94) com as colunas reais, com mapeamento explícito de nomes (`MAPA_COLUNAS`). Etapa 2: varredura inversa (tabelas, colunas, endpoints, telas e tecnologias sem correspondente no documento). Etapa 3: resolução dos achados da Fase 1 (§4). Etapa 4: decisões (`decisoes_pendentes.md`). Etapa 5: autoverificação (§6).

Tipo de evidência: FATO = lido no código/migration citado; INFERÊNCIA = conclusão a partir de ausência ou de estrutura; DÚVIDA = não decidível por leitura.

## 3. Estado do build e dos testes (executados em 22/10/2026)

| Comando | Resultado | Log |
|---|---|---|
| `backend> ./mvnw -q -DskipTests compile` | OK (EXIT 0) | `log_backend_compile.txt` |
| `backend> ./mvnw verify` (surefire + failsafe/Testcontainers) | **BUILD SUCCESS**; unitários 230/230; integração 445/445; 0 falhas | `log_backend_verify.txt` |
| `frontend> npm run build` (tsc -b && vite build) | OK em 6,0 s | `log_frontend_build.txt` |
| `frontend> npm test` (vitest) | 83 arquivos, 498 testes: **492 ok, 6 falhas** (EXIT 1) | `log_frontend_test.txt` |

As 6 falhas (useDashboardKpis.test, Dashboard.test ×3, useGraficos.test, GraficosDashboard.test) ocorrem porque os testes assumem o modo mock dos KPIs/gráficos e `frontend/.env` define `VITE_USE_MOCK_KPIS=false` e `VITE_USE_MOCK_GRAFICOS=false`; o MSW recusa `/api/dashboard/kpis|graficos` ("no matching request handler"). É configuração de ambiente de teste, não regra de negócio; não foi corrigida (modo somente leitura). Nenhuma migration foi executada fora dos containers efêmeros do Testcontainers e nenhum banco real foi acessado.

## 4. Resolução dos achados da Fase 1 à luz do código

Total: 66 achados/pendências. Resolvidos pelo código: **39**; parcialmente: **10**; o código não resolve (questão documental/ABNT ou funcionalidade inexistente): **17**.

| Achado | Sev. | Veredito | O que o código faz / qual versão confirma |
|---|---|---|---|
| F1-001 | MÉDIA | o código não resolve | Nomes de casos de uso (diagrama × quadro) são questão documental; o código não nomeia casos de uso. |
| F1-002 | MÉDIA | parcial | O código tem GET /api/auditoria (AuditoriaController.java:23-28) sem filtros e sem tela; confirma que a trilha existe como funcionalidade e precisa de RF próprio. Ver linha UC Quadro 22 (DECISAO_AUTORES). |
| F1-003 | MÉDIA | resolve | Confirma a versão da Figura 6: o Agente Sanitário acessa alertas vacinais e ocupação (GESTAO_ANIMAIS:leitura no seed V3; /alertas/vacinas sem guard de perfil). |
| F1-004 | MÉDIA | resolve | O código não fixa quantidade nem nomes de baias (sem seed; nome livre varchar(40); tipos interna/gatil/externa). Nenhuma das versões (8 ou 4 externas) é regra do sistema: o documento deve descrever as baias como cadastráveis. |
| F1-005 | BAIXA | o código não resolve | Uniformidade do campo "Atores Secundários" é documental. |
| F1-006 | BAIXA | resolve | Não há adoção nem devolução no código (sem tabela adocao). A questão passa a ser remover/mover para Trabalhos futuros (ver RF-A05). |
| F1-007 | MÉDIA | resolve | Confirma a leitura ampla do Quadro 4: o Veterinário cria e edita baias (GESTAO_ANIMAIS:escrita; GestaoBaias.tsx:46); só a exclusão é do Admin. |
| F1-008 | MÉDIA | parcial | Protótipos com veterinário em ocorrências estão errados (V11 remove acesso do Vet a OCORRENCIAS); mas o Vet realmente escreve em processos (seed V3) — ver RN09. |
| F1-009 | BAIXA | resolve | O código usa só o enum Modulo (USUARIOS_ACESSO, GESTAO_ANIMAIS, OCORRENCIAS_DENUNCIAS, PROCESSOS_SANITARIOS, RELATORIOS); as letras A/B/D/E não existem no código. Incluir tabela de correspondência no documento. |
| F1-010 | ALTA | resolve | Auditoria do acesso ao denunciante sigiloso está implementada: AcaoAuditoria.VISUALIZACAO (V12) em OcorrenciaService.java:618 e no download de anexo (:504-514). Incluir o passo nos Quadros 38/39. Observação: o Agente também tem a feature (ver RN03). |
| F1-011 | ALTA | resolve | Versão do código: NOT NULL em nome, especie_id, sexo, esterilizado, status_id, motivo_entrada_id, data_entrada; porte e baia_id nulos permitidos (V4; CriarAnimalRequest). RN07 e Figura 13 devem ser alinhadas a isso. |
| F1-012 | ALTA | resolve | Versão do código: doenca_id e laboratorio_id NOT NULL (V13); endereço do responsável opcional; nome obrigatório. Alinhar RN08, Figura 10 e Figura 15. |
| F1-013 | ALTA | o código não resolve | Não há laudo de eutanásia no código (buscas "laudo|eutanasia" → só o status obito_eutanasia). Pendência confirmada; ver RF-A05 (DECISAO_AUTORES). |
| F1-014 | MÉDIA | resolve | Versão dos protótipos confirmada: ProtocoloService.java:44 formata "%03d/%d" (3 dígitos). Corrigir RN02/RF-E01/RF-B01 para NNN/AAAA. |
| F1-015 | MÉDIA | resolve | Código: protocolo varchar(20) em ocorrencia e processo_sanitario (V10). Nenhuma das duas versões do documento (9/50) coincide; usar 20. |
| F1-016 | MÉDIA | resolve | O bloqueio de conclusão sem resultado vale para todo processo (ProcessoSanitarioService.java:414-419), confirmando a leitura literal de RF-B05. |
| F1-017 | MÉDIA | resolve | Registros clínicos não são atualizados em etapas: correção/mudança de status gera novo registro com retifica_id (V6) e triggers impedem DELETE (V17). Exame não existe. RN06 é cumprida pelo mecanismo de retificação. |
| F1-018 | MÉDIA | resolve | DocumentoProcesso não existe no código; RelatorioGerado não tem estados. RN11 deve ser reescrita e a referência a DocumentoProcesso removida. |
| F1-019 | MÉDIA | resolve | Base do alerta = data_aplicacao + vacina.intervalo_meses (AlertaVacinalService.java:85; VacinacaoMapper.java:42); não existe coluna data_validade. Versão do Quadro 62/29 prevalece. |
| F1-020 | BAIXA | parcial | Usuários e preferências não são imutáveis (há PATCH); anexos de ocorrência não têm DELETE (imutáveis de fato, sem trigger); auditoria_evento não tem endpoint de alteração. Confirma que RN06 só se aplica a registros clínicos, processos e resultados (triggers V17/V14). |
| F1-021 | BAIXA | resolve | notif_email_diario é persistido (V2; Configuracoes.tsx) mas não há job (@Scheduled ausente) nem envio de resumo diário: funcionalidade sem implementação. Remover ou mover para Trabalhos futuros. |
| F1-022 | BAIXA | resolve | Tabela protocolo_sequencia (V10) com upsert "ON CONFLICT ... DO UPDATE ... RETURNING" em transação MANDATORY (ProtocoloService.java:41-56). Citar na RN02 e no modelo de dados. |
| F1-023 | CRÍTICA | resolve | Versão stateless confirmada: tabela sessao criada em V2 e removida em V8 (V8__remove_tabela_sessao.sql); SecurityConfig.java:39 STATELESS. Remover Sessao do DER (Fig. 7) e do lógico (Fig. 12). |
| F1-024 | ALTA | resolve | Adocao não existe em nenhuma camada (comentário em DashboardKpisResponse.java:5-8). Versão do DER/lógico (sem Adocao) é a do código; remover Quadro 79 e a classe da Fig. 18 ou mover para Trabalhos futuros. |
| F1-025 | ALTA | resolve | Ocupação é calculada (BaiaService.java:120-147; V4 comenta "atual_ocupacao NÃO é coluna"). Remover animais_alojados das Figuras 8 e 13. |
| F1-026 | ALTA | resolve | O código tem as entidades do lógico/dicionário (vacina, vacinacao, procedimento, prescricao, medicamento, categoria_farmacologica, tipo_procedimento) e NÃO tem exame/anexos/adocao/vacina_especie/animal_sintoma. O DER M2 deve ser redesenhado a partir das 12 tabelas reais do módulo (V4–V6). |
| F1-027 | ALTA | resolve | Cardinalidade real: processo_sanitario.ocorrencia_id UNIQUE nullable (V10) → Ocorrência (0,1) — (0,1) Processo, vínculo imutável (trigger V13). Versão da Figura 9 ("Gera" (0,1)/(0,1)) é a correta. |
| F1-028 | MÉDIA | resolve | Tabela usuario única (V2) com 14 colunas (inclui dois_fatores_ativo); as cópias nos DER de outros módulos devem mostrar só id (como «external»). |
| F1-029 | MÉDIA | resolve | As 5 colunas notif_* existem em preferencia_usuario (V2) e são expostas na API/tela; a classe da Figura 17 está incompleta. |
| F1-030 | MÉDIA | resolve | Mínimos reais (V13): doenca_id NN (1,1), laboratorio_id NN (1,1), responsavel 1:1 obrigatório por trigger, ocorrencia_id opcional (0,1). Corrigir Figura 10. |
| F1-031 | MÉDIA | resolve | denunciante e denunciado são 0..1 por ocorrência (FK ocorrencia_id UNIQUE no filho, V10); denunciante ausente quando anônima. Corrigir Figura 9 para (0,1) em ambos. |
| F1-032 | MÉDIA | resolve | Nome do código é animal_amostrado/AnimalAmostrado (versão do DER); atributo numero_campo não existe; animal_id opcional. Alinhar lógico/dicionário/classes ao nome do código. |
| F1-033 | MÉDIA | resolve | Catálogos do código têm coluna codigo UNIQUE (especie, status_animal, motivo_entrada, tipo_baia, vacina, tipo_procedimento, tipo_ocorrencia, providencia_tomada, doenca, laboratorio, sintoma, resultado_laboratorial, desfecho_animal) e grafia snake_case. Uniformizar o DER com essa convenção. |
| F1-034 | MÉDIA | parcial | Especie é tabela (V4) com 4 códigos (canino, felino, quiroptero, pnh); novas espécies podem ser inseridas sem alterar código (mitiga o risco), mas o seed atual não cobre capivara/equino/bovino. Documentar como catálogo extensível. |
| F1-035 | MÉDIA | resolve | cargo_permissao é entidade dependente de cargo (FK cargo_id, sem FK para módulo; UQ cargo/modulo/feature) — versão do lógico/dicionário. Corrigir a Figura 7. |
| F1-036 | BAIXA | resolve | Código usa snake_case no banco e camelCase nas entidades com correspondência direta: usuario.senha → Usuario.senha (Usuario.java:41, não "senhaHash"); vacinacao.aplicado_por_id → Vacinacao.aplicadoPor (:54); animal.microchip → Animal.microchip (:75); animal.status_id → Animal.status (:85); animal.criado_por_id → Animal.criadoPor (:109). Os nomes das classes da Figura 17–25 devem seguir as entidades JPA reais. |
| F1-037 | BAIXA | resolve | auditoria_evento.entidade_id existe desde a V9 e é preenchido pelos serviços (AuditoriaEventoService.registrar(..., entidadeId, ...)). Incluir no Quadro 57/Figura 12/17. |
| F1-038 | MÉDIA | resolve | Só csv e pdf (RelatorioGeradoService.java:93-96). Remover Excel do Quadro 49/Figura 30. |
| F1-039 | BAIXA | resolve | Não há estados nem progresso: exportação síncrona com download direto. Remover progresso/estados do protótipo e de RN11. |
| F1-040 | ALTA | resolve | T18–T23 não são rotas próprias; são previews da T14 (/relatorios). Incluir no Quadro 15 como visualizações da T14. |
| F1-041 | MÉDIA | resolve | RF-B06 não existe no código (sem tela mesmo); trilha de auditoria tem endpoint mas não tela. Ver RF-B06 (REMOVER_DO_DOC) e Quadro 22 (DECISAO_AUTORES). |
| F1-042 | MÉDIA | resolve | tipo_baia seed inclui "gatil" (V4) e não há nomes fixos: o protótipo ("Gatil A", "Externa 2") é compatível com o código; a especificação (BAIA 1–16, E1–E8, CORREDOR) é que deve ser relaxada. |
| F1-043 | BAIXA | resolve | Os alertas do protótipo existem no código: sem_avaliacao_30d, nao_castrado, ficha_incompleta (DashboardService.java:220-245). Criar requisito em RF-D01. |
| F1-044 | BAIXA | resolve | Configuracoes.tsx tem abas prefs (tema, densidade) e notif (4 notificações): o texto de 5.2 deve citar notificações. |
| F1-045 | MÉDIA | parcial | Não há mapa real; o relatório é tabular (RelatorioOcorrenciasBairroService). Porém ocorrencia tem latitude/longitude e a tela mostra um "map-stub" (OcorrenciaDetalhe.tsx:259-261) — o 3.4 precisa de nota. |
| F1-046 | MÉDIA | resolve | Pacotes do código: usuarios e relatorios; enum: USUARIOS_ACESSO e RELATORIOS; menu: "Usuários"/"Relatórios". Nomes curtos prevalecem para módulos 1 e 5 nas referências técnicas; manter nome longo só como título de capítulo. |
| F1-047 | BAIXA | resolve | Não há consulta externa de CEP (busca "viacep|cep" no front sem chamada HTTP). Remover o passo do Quadro 35. |
| F1-048 | BAIXA | o código não resolve | Grafia AnimalTag/AnimalTech não aparece no código. |
| F1-049 | BAIXA | o código não resolve | Contagem de gatos é dado de campo; não verificável no código. |
| F1-050 | ALTA | o código não resolve | Numeração de figuras é documental. |
| F1-051 | ALTA | o código não resolve | Lista de Figuras é documental. |
| F1-052 | MÉDIA | o código não resolve | Sumário é documental. |
| F1-053 | BAIXA | o código não resolve | Citação de quadros/figuras no texto é documental. |
| F1-054 | BAIXA | o código não resolve | Legendas não chamadas no texto: documental. |
| F1-055 | BAIXA | parcial | Recharts está em uso (package.json; features/graficos), o que justifica citar a referência RECHARTS no texto da Seção 2.3.2. |
| F1-056 | BAIXA | o código não resolve | Frase truncada: documental. |
| F1-057 | BAIXA | o código não resolve | Fontes das planilhas: documental. |
| F1-058 | BAIXA | o código não resolve | Separador de legenda: documental. |
| F1-059 | BAIXA | o código não resolve | Fragmento de legenda: documental. |
| F1-060 | BAIXA | o código não resolve | Pontuação de fontes: documental. |
| F1-061 | BAIXA | o código não resolve | Lista de siglas: documental (siglas usadas no código, como GAL/SINAN/CID, aparecem em V13, o que confirma que devem constar). |
| P-001 | — | parcial | As 17 telas (T01–T17) existem como rotas (AppRoutes.tsx:92-137); as capturas podem ser feitas a partir do sistema em execução (npm run dev / docker compose up). |
| P-002 | — | parcial | T18–T23 existem como previews em /relatorios; capturas possíveis a partir da T14. |
| P-003 | — | parcial | Há evidência para redigir a seção de testes: 230 unitários + 445 de integração no backend (mvn verify OK) e 498 testes no frontend (492 ok; 6 falhas de configuração de ambiente). Testes E2E (Playwright) não existem. |
| P-004 | — | o código não resolve | Placeholders da Lista de Figuras: documental. |
| P-005 | — | parcial | Estado do código em 22/10/2026: 22 migrations, build e testes de backend verdes; o cronograma do Quadro 5 (S8 testes E2E) não se concretizou (sem Playwright). |

## 5. Estimativa de esforço em código

### 5.1 Recomendado (ATUALIZAR_CODIGO / AMBOS)

| ID | Item | Esforço | Arquivos |
|---|---|---|---|
| F2-012 | RF-B01 Registro de Processo | P | backend/src/main/java/com/siszoo/processos/dto/CriarProcessoRequest.java; ProcessoSanitarioService.criar; ProcessoSanitarioResponse/ProcessoMapper; frontend/src/features/processos/components/ProcessoForm.tsx; processoSchema.ts; ProcessoSanitarioControllerIT |
| F2-029 | UC "Editar Dados do Animal" (Quadro 24) | P | backend/src/main/java/com/siszoo/animais/service/AnimalService.java (atualizar/criar: auditoriaEventoService.registrar); AnimalControllerIT |
| F2-045 | UC "Abrir Processo Sanitário" (Quadro 40) | P | backend/src/main/java/com/siszoo/processos/dto/CriarProcessoRequest.java; ProcessoForm.tsx |
| F2-078 | RNF10 Rastreabilidade | P | backend/src/main/java/com/siszoo/animais/service/AnimalService.java; backend/src/main/java/com/siszoo/animais/service/BaiaService.java; ITs correspondentes |
| F2-087 | Limitação 3.5.2: sem integração em tempo real com SINAN e GAL (apenas registro dos números) | P | backend/src/main/java/com/siszoo/processos/dto/CriarProcessoRequest.java; ProcessoForm.tsx |

Total recomendado: 5 itens · ≈ **2.5 dias** (P = 0,5 d). Todos cabem antes da entrega se iniciados imediatamente; cada um exige também atualizar o teste de integração correspondente.

### 5.2 Dependente de decisão dos autores (opção "implementar")

| ID | Item | Esforço | Risco |
|---|---|---|---|
| F2-004 | RF-A01 Cadastro de Animal | M | Médio |
| F2-008 | RF-A05 Entrada, Saída e Adoção | G | Alto |
| F2-014 | RF-B03 Resultado Laboratorial | P | Alto |
| F2-027 | UC "Consultar Trilha de Auditoria" (Quadro 22) | M | Médio |
| F2-059 | RN03 Sigilo do Denunciante | P | Alto |
| F2-065 | RN09 Controle de Acesso | P | Médio |
| F2-066 | RN10 Notificação de Resultado | P | Alto |

Se TODAS as opções de implementação fossem escolhidas: ≈ **11.0 dias** — inviável no prazo; por isso a recomendação padrão é documentar o estado atual e mover o restante para Trabalhos futuros.

### 5.3 Itens recomendados para Limitações/Trabalhos futuros (REMOVER_DO_DOC)

- F2-007 RF-A04 Histórico Veterinário (esforço para implementar: G)
- F2-017 RF-B06 Documento PDF (esforço para implementar: G)
- F2-031 UC "Registrar Adoção" (Quadro 26) (esforço para implementar: G)
- F2-037 UC "Registrar Exame" (Quadro 32) (esforço para implementar: G)
- F2-039 UC "Anexar Documento ao Animal" (Quadro 34) (esforço para implementar: G)
- F2-050 UC "Gerar Documento do Processo" (Quadro 45) (esforço para implementar: G)
- F2-154 Playwright (esforço para implementar: G)
- F2-155 Serviço externo de consulta de CEP (esforço para implementar: P)
- F2-182 Enum TipoAmostra (esforço para implementar: P)
- F2-184 Enum StatusDocumento (esforço para implementar: P)
- F2-185 Enum StatusRelatorio (esforço para implementar: P)
- F2-199 Entidade VacinaEspecie (esforço para implementar: M)
- F2-204 Entidade AnimalSintoma (esforço para implementar: M)
- F2-205 Entidade AnexoAnimal (esforço para implementar: G)
- F2-207 Entidade AnexoVacinacao (esforço para implementar: G)
- F2-209 Entidade AnexoProcedimento (esforço para implementar: G)
- F2-212 Entidade TipoExame (esforço para implementar: G)
- F2-213 Entidade Exame (esforço para implementar: G)
- F2-214 Entidade AnexoExame (esforço para implementar: G)
- F2-215 Entidade Adocao (esforço para implementar: G)
- F2-224 Entidade TipoDocumentoProcesso (esforço para implementar: G)
- F2-227 Entidade DocumentoProcesso (esforço para implementar: G)

## 6. Autoverificação (Etapa 5)

Todos os itens com status SÓ NO DOCUMENTO e todas as recomendações ATUALIZAR_CODIGO foram reconfirmados com uma segunda busca (sinônimos, inglês, snake_case/camelCase) em `backend/src/main` e `frontend/src` (arquivos .java, .sql, .ts, .tsx, .yml, excluindo testes). Resultado: **nenhum item precisou ser removido (0 removidos)**. Ocorrências encontradas e por que não contradizem o status:

| Item | Termos | Ocorrências | Interpretação |
|---|---|---|---|
| Adocao/adotante/devolução | adotante, devolução, class Adocao, adocao, tabela adocao | 12 arquivos | Todos se referem ao status `adotado`, ao TipoRelatorio ADOCOES e ao KPI mock; o comentário em DashboardKpisResponse.java:5-8 e RelatorioAdocoesService.java:21-33 afirmam que a tabela não existe. |
| Exame | exame, tipo_exame, TipoExame | 6 arquivos | AbaExames.tsx (placeholder), classes CSS de timeline ("vacina/exame/cirurgia") e comentários; nenhuma entidade/endpoint. |
| Anexos clínicos | anexo_animal, AnexoAnimal, anexo_vacinacao, anexo_procedimento, anexo_exame | 0 | — |
| DocumentoProcesso/StatusDocumento | documento_processo, DocumentoProcesso, StatusDocumento, tipo_documento | 1 arquivo | Comentário em V13__schema_processos.sql dizendo que a tabela não foi criada. |
| StatusRelatorio/url_expira_em | StatusRelatorio, url_expira, urlExpira, EM_PROCESSAMENTO | 0 | — |
| Sessao/token_hash | token_hash, class Sessao, tabela sessao, sessao | 5 arquivos | V2 cria e V8 remove a tabela; SecurityConfig/application.yml/AuthContext usam "sessão" no sentido de JWT/sessionStorage. |
| numero_medalha/data_implantacao_chip/procedencia/data_saida | medalha, implanta, procedencia, data_saida, dataSaida | 1 arquivo | AnimalService.java:181 — comentário "implantado no animal" sobre o microchip; nenhuma coluna. |
| Laudo de eutanásia | laudo, eutan | 7 arquivos | Status/desfecho `obito_eutanasia` (V4/V13) e comentário "a coleta e o laudo podem anteceder a abertura" (ProcessoSanitarioService.java:447); nenhum campo de laudo. |
| Playwright/E2E | playwright, e2e | 0 | — |
| Consulta externa de CEP | viacep, brasilapi, consultaCep, buscarCep | 0 | — |
| TipoAmostra | tipo_amostra, TipoAmostra, IN_NATURA, FORMOL | 0 | — |
| VacinaEspecie/AnimalSintoma | vacina_especie, VacinaEspecie, animal_sintoma, AnimalSintoma | 0 | — |
| Status "resgatado" | resgatad | 0 | — |
| LOGOUT/EXPORTACAO em uso | AcaoAuditoria.LOGOUT, AcaoAuditoria.EXPORTACAO | 0 | Valores existem no enum, mas nunca são gravados. |
| GAL/SINAN informáveis | galNumero, sinanNumero, gal_numero, sinan_numero | 3 arquivos | Entidade e V13 têm as colunas; ProcessoSanitarioResponse.java:19 comenta que "galNumero/sinanNumero ... nao entram aqui"; nenhum DTO de entrada nem tela — confirma ATUALIZAR_CODIGO (P). |
| Job agendado | @Scheduled, EnableScheduling | 1 arquivo | Comentário em AlertaVacinalService.java:25-26 confirmando que não há @EnableScheduling. |
| E-mail diário | emailDiario, email_diario, resumo di | 9 arquivos | Só persistência/exibição da preferência; nenhum envio. |

## 7. Limitações desta análise

- Análise estática: a UI não foi exercitada manualmente nem com E2E; comportamentos de tela são inferidos do código das páginas e dos testes unitários (Vitest).
- Nenhum banco real foi acessado; o schema foi reconstruído das migrations (`parse_schema.py`) e corroborado pelas entidades JPA (`ddl-auto: validate`, confirmado pelos 445 testes de integração que sobem PostgreSQL via Testcontainers).
- RNF01/RNF02/RNF05/RNF07/RNF09 não são verificáveis por leitura de código (sem medições no repositório); RNF04 e HTTPS dependem da infraestrutura de implantação.
- Linhas de código citadas valem para o commit `b3ce1de`; alterações posteriores podem deslocá-las.
- Linhas de atributo comparam nome e tipo-base; comprimentos de varchar e precisão são anotados, não tratados como divergência. NOT NULL foi comparado apenas onde o documento o afirma (RN07, RN08, Figuras lógicas).
- Métodos de domínio dos diagramas de classes (Figuras 17–25) não foram rastreados um a um: as entidades JPA do código são anêmicas (lógica nos services), de modo que a comparação é de responsabilidade, não de assinatura; isso está refletido nas linhas de RF/UC/RN.
- Prazo de entrega assumido (23–25/10/2026) por não constar no prompt; se houver prorrogação, as recomendações M (edição de usuário, filtros, campos do animal, tela de auditoria) tornam-se candidatas a ATUALIZAR_CODIGO.
- As 6 falhas do `npm test` não foram corrigidas (modo somente leitura); a correção é P (ajustar `frontend/.env`/handlers MSW dos testes).

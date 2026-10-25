# Decisões pendentes dos autores — Fase 2 (SISZOO)

Gerado em 22/10/2026 a partir de `matriz_rastreabilidade.csv` (commit `b3ce1de`). Contém **somente** os itens com decisão recomendada `DECISAO_AUTORES` e os `ATUALIZAR_CODIGO`/`AMBOS` com esforço M ou G. Itens que apenas remetem a outro (ex.: telas e casos de uso cuja decisão é a de RN09) estão listados ao final como dependentes.

Premissa de prazo: entrega em 23/10/2026 (CLAUDE.md) ou 25/10/2026 (Quadro 5, S9); hoje é 22/10/2026. Só mudanças de código de esforço P são viáveis antes da entrega; as de esforço M/G devem ser decididas como "documentar como está" ou "trabalho futuro", salvo prorrogação.

Legenda de esforço (código): P ≤ 0,5 dia · M 1–3 dias · G > 3 dias. Risco: impacto de errar a decisão (regra crítica/LGPD = Alto).

| ID | Item | Status | Decisão | Esforço | Risco |
|---|---|---|---|---|---|
| F2-004 | RF-A01 Cadastro de Animal | PARCIAL | DECISAO_AUTORES | M | Médio |
| F2-008 | RF-A05 Entrada, Saída e Adoção | SÓ NO DOCUMENTO | DECISAO_AUTORES | G | Alto |
| F2-014 | RF-B03 Resultado Laboratorial | DIVERGENTE | DECISAO_AUTORES | P | Alto |
| F2-027 | UC "Consultar Trilha de Auditoria" (Quadro 22) | PARCIAL | DECISAO_AUTORES | M | Médio |
| F2-059 | RN03 Sigilo do Denunciante | DIVERGENTE | DECISAO_AUTORES | P | Alto |
| F2-065 | RN09 Controle de Acesso | DIVERGENTE | DECISAO_AUTORES | P | Médio |

---

## F2-004 — RF-A01 Cadastro de Animal

- **Módulo:** M2 · **Status:** PARCIAL · **Tipo de evidência:** FATO · **Achados F1:** F1-026
- **Documento diz** (Quadro 7 (p. 29 conforme sumário)): Registrar um animal com número do microchip (identificador único, RN01) e data de implantação do chip, número da medalha, espécie, nome, raça, sexo, porte, pelagem, coloração, data de nascimento aproximada, baia, foto, esterilizado, data de esterilização, observações, motivo de entrada, procedência, peso, status e data de entrada. O animal pode ser cadastrado sem microchip, que é registrado quando implantado.
- **Código faz** (backend/src/main/java/com/siszoo/animais/dto/CriarAnimalRequest.java:15-67; backend/src/main/resources/db/migration/V4__schema_animais.sql (tabela animal); backend/src/main/resources/db/migration/V16__animal_microchip_normalizado.sql; backend/src/main/java/com/siszoo/animais/service/AnimalService.java:89-105,185-202): Campos: nome, especie, sexo, raca, coloracao, pelagem, porte, pesoKg, idadeAprox, dataNascimentoAprox, microchip (opcional), esterilizado, dataEsterilizacao, status, motivoEntrada, dataEntrada, baiaId, fotoUrl, observacoes. Não existem colunas numero_medalha, data_implantacao_chip, procedencia. Microchip pode ser informado depois (PUT) e passa a ser imutável.
- **Análise:** Três atributos especificados (data de implantação do chip, número da medalha, procedência) não existem no código. Adicioná-los é esforço M (migration + entidade + DTOs + formulário + testes). Nenhum deles é exigido por RN crítica, mas RN01 cita "o número e a data de implantação são registrados"; os autores devem escolher entre implementar (M) ou remover os três campos do RF-A01, da RN01 e do Quadro 67.
- **Esforço em código:** M · **Risco:** Médio
- **Locais no documento:** Quadro 7 (RF-A01); Quadro 13 (RN01); Quadro 67 (Animal); Figura 13 (lógico M2); Figura 18 (classe Animal)
- **Arquivos no código:** backend/src/main/resources/db/migration/V23__animal_campos_identificacao.sql (novo); backend/src/main/java/com/siszoo/animais/entity/Animal.java; CriarAnimalRequest/AtualizarAnimalRequest/AnimalResponse; AnimalMapper; frontend/src/features/animais/components/AnimalForm.tsx; animalSchema.ts; testes AnimalControllerIT

**Opções:**

| Opção | Prós | Contras |
|---|---|---|
| Implementar os 3 campos (numero_medalha, data_implantacao_chip, procedencia) | Documento permanece como está; RN01 fica integralmente suportada | Esforço M em prazo curto; medalha UNIQUE exige regra de normalização igual à do microchip |
| Remover os 3 campos do documento (RF-A01, RN01, Quadro 67, Fig. 13/18) e citar em Trabalhos futuros | Esforço P só no documento; código já testado | Perde-se a rastreabilidade da data de implantação, citada como relevante pela equipe do CCZ |

**Decisão dos autores:** ☐ A  ☐ B  ☐ C  — observação: ______________________

## F2-008 — RF-A05 Entrada, Saída e Adoção

- **Módulo:** M2 · **Status:** SÓ NO DOCUMENTO · **Tipo de evidência:** FATO · **Achados F1:** F1-006; F1-013; F1-024
- **Documento diz** (Quadro 7 (p. 29 conforme sumário)): Registrar a procedência ao entrar e o destino e a data de saída ao sair (Adotado, Resgatado, Óbito, Eutanásia ou Transferido). No destino Eutanásia, registrar o laudo do responsável técnico que a justifica (Lei nº 14.228/2021, art. 2º, § 1º). Na adoção, registrar os dados do adotante e, quando houver, a devolução do animal. Histórico imutável (RN06).
- **Código faz** (backend/src/main/resources/db/migration/V4__schema_animais.sql (status_animal seed: disponivel_adocao, em_tratamento, em_quarentena, adotado, obito_natural, obito_eutanasia, transferido; animal sem data_saida/procedencia); backend/src/main/java/com/siszoo/animais/service/AnimalService.java (atualizar: muda status via PUT, sem auditoria); backend/src/main/java/com/siszoo/relatorios/dto/DashboardKpisResponse.java:5-8; backend/src/main/java/com/siszoo/relatorios/service/RelatorioAdocoesService.java:21-33; buscas "adocao|Adocao|laudo|data_saida|resgatado" sem tabela/campo): Saída = alteração do status do animal (PUT /api/animais/{id}) para adotado/obito_natural/obito_eutanasia/transferido; não há data_saida, procedência, laudo de eutanásia, tabela adocao (adotante/devolução) nem status "resgatado". Comentário do código: "o DER documenta a tabela adocao ... mas ela nunca foi implementada". Relatório de adoções usa snapshot de status = adotado.
- **Análise:** A saída existe apenas como mudança de status (sem data, sem laudo, sem adotante). Adoção completa (tabela adocao + devolução) é esforço G → critério 3 (REMOVER_DO_DOC/Trabalhos futuros). O laudo de eutanásia é exigência legal citada no RF (critério 1) e poderia ser atendido com esforço P–M (campo texto obrigatório quando status = obito_eutanasia + auditoria). Decisão dos autores: implementar o mínimo legal (laudo + data_saida) ou reescrever RF-A05 como "saída por status" e mover adoção/laudo para Trabalhos futuros.
- **Esforço em código:** G · **Risco:** Alto
- **Locais no documento:** Quadro 7 (RF-A05); Quadro 25 (Registrar Saída/Desfecho); Quadro 26 (Registrar Adoção); Quadro 79 (Adocao); Quadro 67 (data_saida, procedencia); Figura 18/21 (StatusAnimal, classe Adocao); Quadro 11 (relatório Adoções); Considerações finais
- **Arquivos no código:** Opção laudo: backend/src/main/resources/db/migration/V23 (animal.data_saida, animal.laudo_eutanasia), backend/src/main/java/com/siszoo/animais/service/AnimalService.java (validação + AuditoriaEvento), AnimalForm.tsx. Opção adoção completa: tabela adocao, AdocaoController/Service, tela

**Opções:**

| Opção | Prós | Contras |
|---|---|---|
| Implementar só o mínimo legal: data_saida + laudo_eutanasia obrigatório para obito_eutanasia, com AuditoriaEvento | Atende a Lei nº 14.228/2021 citada; esforço P–M | Adoção continua como status simples; Quadro 26/79 precisam ser removidos |
| Reescrever RF-A05 como saída por status e mover adoção/laudo/devolução para Trabalhos futuros | Sem mudança de código | Requisito de alta prioridade com exigência legal fica declarado como não atendido |
| Implementar adoção completa (tabela adocao, adotante, devolução) e laudo | Documento inalterado | Esforço G, inviável no prazo |

**Decisão dos autores:** ☐ A  ☐ B  ☐ C  — observação: ______________________

## F2-014 — RF-B03 Resultado Laboratorial

- **Módulo:** M4 · **Status:** DIVERGENTE · **Tipo de evidência:** FATO · **Achados F1:** —
- **Documento diz** (Quadro 9 (p. 30 conforme sumário)): Registrar resultado (Negativo/Positivo/Material Inadequado/Inconclusivo/Não Realizado/Aguardando) e desfecho. Resultado Positivo ou Inconclusivo notifica por e-mail o responsável e a Vigilância Epidemiológica (RN10).
- **Código faz** (backend/src/main/java/com/siszoo/processos/service/ProcessoSanitarioService.java:119-125,442-484; backend/src/main/java/com/siszoo/processos/service/NotificacaoResultadoService.java:28-51,88,161-166; backend/src/main/resources/db/migration/V13 (seed resultado_laboratorial: aguardando, positivo, negativo, inconclusivo, material_inadequado, nao_realizado); backend/src/main/resources/db/migration/V14/V15/V21 (resultado_processo imutável; positivo definitivo); frontend/src/features/processos/components/CardResultadoProcesso.tsx:38-41): POST /api/processos/{id}/resultados grava resultado_processo (histórico imutável, correção via retifica_id); "aguardando" não é lançável (é o estado sem resultado); RESULTADO_QUE_NOTIFICA = "positivo" (comentário: "inconclusivo deixou de notificar"); Vigilância: log.info("[MOCK] notificacao a Vigilancia Epidemiologica ... seria enviada"); desfecho_animal_id existe na tabela mas não é lançado por este endpoint (busca em RegistrarResultadoRequest).
- **Análise:** Dois desvios de uma RN crítica (RN10): (a) só Positivo notifica — decisão registrada no código ("Regra 19 (DER, revisão 2026-10-17)"), portanto mudança consciente → ATUALIZAR_DOC; (b) e-mail à Vigilância Epidemiológica é apenas log mock porque não há endereço real — implementar é P (propriedade de configuração + segundo destinatário) mas depende de o CCZ fornecer o endereço. Autores decidem: implementar (b) com endereço configurável, ou documentar a Vigilância como notificação manual/trabalho futuro.
- **Esforço em código:** P · **Risco:** Alto
- **Locais no documento:** Quadro 9 (RF-B03); Quadro 13 (RN10); Quadro 42; Quadro 15 (T13); Figura 23 (exigeNotificacao)
- **Arquivos no código:** backend/src/main/java/com/siszoo/processos/service/NotificacaoResultadoService.java:161-166; application.yml (siszoo.notificacoes.vigilancia-email); templates/email; NotificacaoResultadoServiceIT

**Opções:**

| Opção | Prós | Contras |
|---|---|---|
| Implementar envio real à Vigilância Epidemiológica com endereço configurável (application.yml), mantendo só Positivo | Fecha RN10 quanto aos destinatários; esforço P | Depende de endereço institucional confirmado pelo CCZ; sem ele o envio falha silenciosamente |
| Documentar: só Positivo notifica; Vigilância é comunicada manualmente (mover envio automático para Trabalhos futuros) | Sem mudança de código; reflete a decisão já tomada pela equipe | RN10 e RF-B03 precisam ser reescritos; perde-se o requisito original |
| Voltar a notificar também Inconclusivo (reverter decisão) | Documento inalterado nesse ponto | Contraria decisão registrada no código e no front; trigger V21 trata só positivo como definitivo |

**Decisão dos autores:** ☐ A  ☐ B  ☐ C  — observação: ______________________

## F2-027 — UC "Consultar Trilha de Auditoria" (Quadro 22)

- **Módulo:** M1 · **Status:** PARCIAL · **Tipo de evidência:** FATO · **Achados F1:** F1-002; F1-041
- **Documento diz** (Quadro 22 (Apêndice A)): Admin consulta eventos com filtros (usuário, período, entidade).
- **Código faz** (backend/src/main/java/com/siszoo/usuarios/controller/AuditoriaController.java:23-28 (GET /api/auditoria?pagina&tamanho); backend/src/main/java/com/siszoo/usuarios/service/AuditoriaEventoService.java:52,63; busca "auditoria" em frontend/src → nenhuma tela): Endpoint paginado sem filtros; listarPorEntidade existe no serviço mas não é exposto; nenhuma rota/página no frontend.
- **Análise:** A trilha é gravada (RNF10) mas não é consultável pelo usuário. Tela simples + filtros é M. Autores decidem: implementar tela mínima ou documentar a consulta como "via banco/endpoint" e Trabalho futuro. Em qualquer caso, criar o RF que o UC realiza (fecha F1-002).
- **Esforço em código:** M · **Risco:** Médio
- **Locais no documento:** Quadro 22; Quadro 6 (novo RF); Quadro 15 (tela nova ou nota); Figura 2
- **Arquivos no código:** Opcional: AuditoriaController (filtros usuarioId/entidade/periodo), frontend/src/features/auditoria (nova), nav.ts, AppRoutes.tsx

**Opções:**

| Opção | Prós | Contras |
|---|---|---|
| Implementar tela de auditoria mínima (lista paginada + filtros por entidade/usuário/período) | Fecha RNF10 "rastreabilidade" de ponta a ponta | Esforço M; mais uma tela a documentar em 5.2 |
| Manter só o endpoint e documentar a consulta como administrativa (sem tela), Trabalho futuro | Sem código novo | UC do diagrama fica sem tela; precisa de RF explícito e nota em Limitações |

**Decisão dos autores:** ☐ A  ☐ B  ☐ C  — observação: ______________________

## F2-059 — RN03 Sigilo do Denunciante

- **Módulo:** M3 · **Status:** DIVERGENTE · **Tipo de evidência:** FATO · **Achados F1:** F1-010
- **Documento diz** (Quadro 13 (p. 32 conforme sumário)): Em ocorrências sigilosas, os dados do denunciante não são exibidos para nenhum perfil exceto Administrador; o acesso do Administrador é registrado em auditoria.
- **Código faz** (backend/src/main/java/com/siszoo/ocorrencias/mapper/OcorrenciaMapper.java:28-31 (DENUNCIANTE_MASCARADO); backend/src/main/java/com/siszoo/ocorrencias/service/PermissoesOcorrencia.java:15 (SIGILO = "OCORRENCIAS_DENUNCIAS:denunciante_sigiloso:leitura"); backend/src/main/java/com/siszoo/ocorrencias/service/OcorrenciaService.java:525-532,618 (AcaoAuditoria.VISUALIZACAO), 504 (anexo); backend/src/main/resources/db/migration/V10__schema_ocorrencias.sql (feature denunciante_sigiloso concedida a Administrador E Agente Sanitário); backend/src/main/resources/db/migration/V12 (acao VISUALIZACAO)): Mascaramento feito no backend (campos null) para quem não tem a feature; quem tem a feature e abre a ocorrência sigilosa gera evento VISUALIZACAO (também ao baixar anexo). A feature está concedida ao Administrador e ao Agente Sanitário.
- **Análise:** Mecanismo (mascaramento no backend + auditoria do acesso) está implementado e testado — resolve F1-010. Divergência: o Agente Sanitário também vê o denunciante sigiloso (seed V10), contrariando "nenhum perfil exceto Administrador". É regra LGPD (critério 1): se a intenção é só Admin, basta uma migration removendo a permissão do Agente (P); se o Agente precisa do contato para atender a denúncia, atualizar RN03/RF-E02/Quadro 38 e justificar no texto (auditoria cobre ambos).
- **Esforço em código:** P · **Risco:** Alto
- **Locais no documento:** Quadro 13 (RN03); Quadro 8 (RF-E02); Quadro 38; Quadro 15 (T08); Seção 2.2
- **Arquivos no código:** Opção Admin-only: nova migration backend/src/main/resources/db/migration/V23__sigilo_somente_admin.sql (DELETE cargo_permissao do Agente feature denunciante_sigiloso); OcorrenciaControllerIT (casos do Agente); front: lógica de exibição baseada em authorities

**Opções:**

| Opção | Prós | Contras |
|---|---|---|
| Restringir a feature denunciante_sigiloso ao Administrador (migration P) | Documento inalterado; LGPD mais estrita | Agente que atende a denúncia perde o contato do denunciante; testes de integração do Agente precisam ser ajustados |
| Manter Agente com acesso auditado e atualizar RN03/RF-E02/Quadro 38 | Reflete a necessidade operacional (quem atende precisa do contato); auditoria já cobre | RN enfraquecida frente ao texto original; precisa justificar LGPD (finalidade) no documento |

**Decisão dos autores:** ☐ A  ☐ B  ☐ C  — observação: ______________________

## F2-065 — RN09 Controle de Acesso

- **Módulo:** M1 · **Status:** DIVERGENTE · **Tipo de evidência:** FATO · **Achados F1:** F1-007; F1-008; F1-009
- **Documento diz** (Quadro 13 (p. 32 conforme sumário)): Administrador: acesso total. Veterinário: Gestão de Animais (A) e Dashboard/Relatórios (D). Agente Sanitário: Processos (B), Ocorrências (E) e Dashboard/Relatórios (D).
- **Código faz** (backend/src/main/resources/db/migration/V3__seed_cargos.sql + backend/src/main/resources/db/migration/V11__remove_acesso_vet_ocorrencias.sql (matriz cargo_permissao); frontend/src/lib/nav.ts:17-38; frontend/src/routes (RotaEscritaProcessos: 3 perfis; RotaEscritaAnimais: admin, vet; RotaLeituraOcorrencias: admin, agente)): Admin: todos os módulos (RELATORIOS só leitura). Veterinário: GESTAO_ANIMAIS L/E, PROCESSOS_SANITARIOS L/E, RELATORIOS L (sem OCORRENCIAS após V11). Agente: GESTAO_ANIMAIS L, OCORRENCIAS L/E, PROCESSOS L/E, RELATORIOS L. Menu: vet sem ocorrências/usuários; agente sem baias/usuários.
- **Análise:** Duas concessões a mais que RN09: Veterinário escreve em Processos Sanitários (abre processo, lança resultado) e Agente lê Gestão de Animais (precisa para vincular amostra a animal do canil e ver alertas). Ambas são justificáveis operacionalmente e estão testadas; restringir é P (migration). Como é regra de acesso (critério 1), os autores devem decidir e, se mantiverem, reescrever RN09/Quadro 4/Quadro 15.
- **Esforço em código:** P · **Risco:** Médio
- **Locais no documento:** Quadro 13 (RN09); Quadro 4; Quadro 15 (perfis T04–T13); Seção 2.2; Figuras 1–6
- **Arquivos no código:** Opção restringir: nova migration ajustando cargo_permissao (Vet sem PROCESSOS; Agente sem GESTAO_ANIMAIS) + nav.ts/guards + ITs

**Opções:**

| Opção | Prós | Contras |
|---|---|---|
| Manter a matriz do código e atualizar RN09/Quadro 4/Quadro 15 | Reflete uso real (veterinário lança resultado; agente consulta animais); sem código | Perfis ficam menos segregados que o planejado |
| Restringir: Vet sem Processos; Agente sem Gestão de Animais (leitura) | Documento inalterado | Agente perde acesso aos alertas vacinais e à vinculação de amostra a animal do canil; vários ITs e guards a ajustar (P–M) |

**Decisão dos autores:** ☐ A  ☐ B  ☐ C  — observação: ______________________

---

## Itens dependentes (seguem a decisão de outro item)

| ID | Item | Depende de | Status |
|---|---|---|---|
| F2-028 | UC "Cadastrar Animal" (Quadro 23) | Ver RF-A01 (campos ausentes) e RN07 (porte/baia opcionais). | PARCIAL |
| F2-030 | UC "Registrar Saída/Desfecho" (Quadro 25) | Ver RF-A05. | PARCIAL |
| F2-047 | UC "Registrar Resultado Laboratorial" (Quadro 42) | Ver RF-B03/RN10. | DIVERGENTE |
| F2-057 | RN01 Microchip Único | Ver RF-A01 (campos ausentes): unicidade e cadastro sem chip estão conformes e testados; só a "data de implantação" não é registrada — a decisão (implementar o campo, M, ou removê-lo da RN01) é a mesma de RF-A01. | CONFORME |
| F2-066 | RN10 Notificação de Resultado | Ver RF-B03 (opções). Registro único e idempotência conformes. | DIVERGENTE |
| F2-105 | T04 Animais do canil | Perfis divergem (Agente lê) — ver RN09. | PARCIAL |
| F2-112 | T11 Processos sanitários | Veterinário também acessa — ver RN09. | PARCIAL |
| F2-113 | T12 Abertura de processo | Ver RN09. | PARCIAL |
| F2-114 | T13 Detalhe do processo | Ver RN09 (perfis) e RF-B03. | PARCIAL |
| F2-310 | Animal.numero_medalha | Ver RF-A01. | SÓ NO DOCUMENTO |
| F2-311 | Animal.data_implantacao_chip | Ver RF-A01/RN01. | SÓ NO DOCUMENTO |
| F2-327 | Animal.procedencia | Ver RF-A01/RF-A05. | SÓ NO DOCUMENTO |
| F2-329 | Animal.data_saida | Ver RF-A05 (saída é só mudança de status; sem data). | SÓ NO DOCUMENTO |

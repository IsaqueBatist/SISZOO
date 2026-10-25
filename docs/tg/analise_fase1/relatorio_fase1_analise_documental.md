# Relatório – Fase 1: análise documental do TG SISZOO

Fonte única: `docs/tg/SISZOO_versao_limpa.docx` (extraído em `texto/`, `quadros/`, `figuras/`). Páginas citadas são as das Listas de Figuras/Quadros do próprio documento ("conforme sumário"). Referências "bNNN" são índices de bloco em `texto/blocos.json` e `texto/documento_completo.md`.

## 1. Resumo executivo

- Quadros lidos: 94/94 (Quadros 1–94, um CSV por quadro em `quadros/`). Figuras: 63 números, 69 legendas, 46 imagens embutidas lidas e transcritas (`figuras/transcricoes/`), 23 figuras sem imagem (placeholders).
- Achados de inconsistência: **61** (fora das pendências). Por severidade: CRÍTICA 1, ALTA 11, MÉDIA 26, BAIXA 23. Por tipo: FATO 39, INFERÊNCIA 15, DÚVIDA 7.
- Por verificação: A (Requisitos × Casos de uso) 6, B (Perfis e permissões) 3, C (Regras de negócio) 13, D (Modelagem de dados (DER × lógico × dicionário × classes)) 15, E (Relatórios) 2, F (Telas) 5, G (Escopo, tecnologia e coerência geral) 5, H (Estrutura e ABNT) 12.
- Pendências editoriais (seção 5, fora da contagem): 5 grupos, incluindo 23 capturas de tela ausentes e 4 placeholders nas Considerações Finais.
- Autoverificação (Etapa 3): os achados CRÍTICA/ALTA foram reconferidos nas transcrições e no texto; nenhum foi removido; dois foram rebaixados durante a revisão (protocolo nos protótipos → MÉDIA; RN07 × NOT NULL → INFERÊNCIA, pela legibilidade da Figura 13).

### Os 10 achados mais importantes

| # | ID | Sev. | Resumo |
|---|---|---|---|
| 1 | F1-023 | CRÍTICA | DER e lógico persistem sessões (token_hash) enquanto o texto declara arquitetura stateless e o dicionário/classes omitem a tabela: contradição conceitual que leva a implementações opostas. Versão majoritária: texto + dicionário + classes (3 × 2). |
| 2 | F1-026 | ALTA | O DER conceitual do Módulo 2 representa uma versão anterior do modelo: 11 entidades do lógico/dicionário não existem nele (Adocao, Sintoma, AnimalSintoma, VacinaEspecie, Medicamento, CategoriaFarmacologica, Prescricao, TipoExame, AnexoVacinacao, AnexoProcedime |
| 3 | F1-024 | ALTA | Entidade presente em dois artefatos e ausente nos dois modelos de dados (conceitual e lógico) do mesmo módulo. |
| 4 | F1-025 | ALTA | DER e lógico armazenam a ocupação que texto, dicionário, caso de uso e classes declaram derivada. Versão majoritária: calculada (4 × 2). |
| 5 | F1-027 | ALTA | A mesma associação Ocorrência–Processo tem quatro cardinalidades diferentes nos artefatos. Versão majoritária: processo com 0..1 ocorrência (RF-B01, Fig. 9, 15, 22, 23); número de processos por ocorrência diverge (0..1 na Fig. 22 × * na Fig. 23 × n na Fig. 10) |
| 6 | F1-012 | ALTA | Laboratório e endereço do responsável são obrigatórios pela regra, mas opcionais no modelo lógico (e, no DER, com cardinalidade mínima zero). |
| 7 | F1-010 | ALTA | A segunda metade da RN03 (auditoria do acesso do Administrador, exigência LGPD) não tem passo correspondente no caso de uso nem operação de domínio; o enum AcaoAuditoria tem VISUALIZACAO, mas nada o aciona. |
| 8 | F1-013 | ALTA | Requisito de alta prioridade e exigência legal sem suporte explícito na modelagem nem no caso de uso de saída. |
| 9 | F1-040 | ALTA | Seis telas referenciadas no texto e no apêndice não constam do quadro que "relaciona cada tela aos perfis... requisitos e regras... e à rotina que substitui". |
| 10 | F1-050 | ALTA | Numeração de figuras duplicada (NBR 14724: numeração sequencial única). O Apêndice D continua até a Figura 59 e o Anexo A usa 60–63; as telas do Apêndice E deveriam ser 64–69 (ou vir antes do Apêndice D). |

## 2. Achados por verificação

Formato: ID | Severidade | Tipo | Localização A | Localização B | O que diz A | O que diz B | Por que é um problema | Correção sugerida.

### A. Requisitos × Casos de uso

**Sem divergências em:**
- Todo RF (20) tem ao menos um caso de uso que o cita em "Requisitos relacionados" e todo caso de uso (36) cita ao menos um RF (verificação automática, cruzamentos_automaticos.json: rf_sem_uc = [], uc_sem_rf = []).
- Os 36 casos de uso dos diagramas (Figuras 2–6) têm quadro próprio (Quadros 16–51) e vice-versa; 33 nomes são idênticos.
- Relações «include»/«extend» dos diagramas coincidem com o campo "Caso de Uso Geral" dos quadros (Quadro 20 "inclusão", Quadros 21/26/34/36/37/47/48 "extensão") e as condições [destino = ADOTADO], [há denunciado], [há documento], [status = CONCLUIDO] têm correspondência nos fluxos.
- Prefixos de RF ↔ módulos: RF-C→Quadro 6 (M1), RF-A→Quadro 7 (M2), RF-E→Quadro 8 (M3), RF-B→Quadro 9 (M4), RF-D→Quadro 10 (M5), exatamente como declarado na introdução do Cap. 3 e nas letras de RN09.

**F1-001 | MÉDIA | FATO**
- Localização A: Figura 2 (p. 39 conforme sumário) / Figura 6 (p. 43 conforme sumário) (diagramas de casos de uso)
- Localização B: Quadro 17 (p. 91 conforme sumário) / Quadro 18 (p. 91 conforme sumário) / Quadro 46 (p. 109 conforme sumário) (Apêndice A)
- O que diz A: Elipses: "Encerrar Sessão"; "Editar Preferências"; "Visualizar Dashboard"
- O que diz B: Títulos: "Encerrar Sessão (Logout)"; "Editar Preferências do Usuário"; "Visualizar Dashboard em Tempo Real"
- Por que é um problema: O texto do Apêndice A afirma que "cada caso de uso dos diagramas por módulo tem um quadro próprio", mas três nomes não são idênticos entre diagrama e quadro, o que dificulta a rastreabilidade (os 33 demais coincidem).
- Correção sugerida: Uniformizar os três nomes (no PlantUML ou no título dos Quadros 17, 18 e 46).

**F1-002 | MÉDIA | INFERÊNCIA**
- Localização A: Figura 2 (p. 39 conforme sumário) e Quadro 22 (p. 94 conforme sumário) ("Consultar Trilha de Auditoria")
- Localização B: Quadro 6 (p. 29 conforme sumário) (RF-C02) e Quadro 15 (p. 79 conforme sumário)
- O que diz A: Quadro 22: "Requisitos relacionados: RF-C02, RN06, RNF10"
- O que diz B: RF-C02: "Administrador cadastra, edita, desativa e reativa usuários, atribuindo cargos..." (não menciona consulta à trilha); Quadro 15 não tem tela de auditoria
- Por que é um problema: O caso de uso de consulta à trilha de auditoria não é realizado por nenhum RF explícito (RF-C02 trata de gestão de usuários) e não tem tela correspondente no Quadro 15, embora o Quadro 4 cite "trilha de auditoria" como módulo do Administrador.
- Correção sugerida: Criar um RF (ex.: RF-C04 Consulta à trilha de auditoria) ou ampliar RF-C02, e incluir a tela correspondente no Quadro 15.

**F1-003 | MÉDIA | FATO**
- Localização A: Figura 6 (p. 43 conforme sumário)
- Localização B: Quadro 47 (p. 110 conforme sumário) e Quadro 48 (p. 110 conforme sumário) (Ator Principal) e Quadro 15 (p. 79 conforme sumário) (T03)
- O que diz A: "Consultar Alertas Vacinais" e "Monitorar Ocupação de Baias" ligados apenas por «extend» a "Visualizar Dashboard", acessado por Veterinário e Agente Sanitário; nenhuma associação direta de ator
- O que diz B: Quadro 47 e Quadro 48: "Ator Principal: Veterinário"; Quadro 15 T03 Alertas: "Perfis: Todos"
- Por que é um problema: Pelo diagrama, o Agente Sanitário alcança as extensões a partir do dashboard; pelos quadros, só o Veterinário; pelo Quadro 15, todos os perfis acessam a tela de alertas. Três artefatos, três respostas.
- Correção sugerida: Decidir quem acessa alertas vacinais e ocupação de baias (RN09 dá o módulo A só ao Veterinário) e alinhar Figura 6, Quadros 47/48 e Quadro 15.

**F1-004 | MÉDIA | FATO**
- Localização A: Quadro 7 (p. 29 conforme sumário) (RF-A02) e Cap. 3 intro (b357)
- Localização B: Quadro 28 (p. 98 conforme sumário) (Restrições) e Quadro 60 (p. 115 conforme sumário) (Baia.nome)
- O que diz A: RF-A02: "BAIA 1–16 internas, E1–E8 externas e CORREDOR"; Cap. 3: "corredor e baias externas E1 a E8"
- O que diz B: Quadro 28: "Baias disponíveis: BAIA 1–16 (internas), E1–E4 (externas) e CORREDOR"; Quadro 60: "BAIA 1–16, E1–E4, CORREDOR"
- Por que é um problema: Divergência factual sobre a quantidade de baias externas (8 × 4) entre requisito, caso de uso e dicionário de dados.
- Correção sugerida: Confirmar com a planilha do CCZ (Anexo A) e corrigir RF-A02/b357 ou Quadros 28 e 60.

**F1-005 | BAIXA | FATO**
- Localização A: Quadro 38 (p. 104 conforme sumário) ("Atores Secundários: Administrador")
- Localização B: Quadros 16 (p. 90 conforme sumário)–51 restantes e Figura 4 (p. 41 conforme sumário)
- O que diz A: Quadro 38 é o único quadro que preenche "Atores Secundários" (com Administrador)
- O que diz B: Nos demais 35 quadros o campo fica vazio, embora o Administrador herde todos os casos (Figuras 1–6; texto 4.1)
- Por que é um problema: Uso não uniforme do campo "Atores Secundários": o Administrador participa por herança em todos os casos, mas só é citado em um.
- Correção sugerida: Padronizar: ou preencher o Administrador em todos os quadros (por herança) ou retirá-lo do Quadro 38.

**F1-006 | BAIXA | FATO**
- Localização A: Quadro 7 (p. 29 conforme sumário) (RF-A05)
- Localização B: Quadro 15 (p. 79 conforme sumário) (T06) e Quadro 26 (p. 96 conforme sumário)
- O que diz A: RF-A05: "Na adoção, registrar os dados do adotante e, quando houver, a devolução do animal"
- O que diz B: Quadro 26 Fluxo Alt. I descreve a devolução; Quadro 15 T06 cita RF-A05; nenhum caso de uso da Figura 3 chama-se "Registrar Devolução"
- Por que é um problema: A devolução é tratada apenas como fluxo alternativo de "Registrar Adoção", que por sua vez é extensão de "Registrar Saída/Desfecho"; após a devolução o animal volta ao canil, mas não há caso de uso nem fluxo de reentrada (baia, status).
- Correção sugerida: Explicitar a devolução (novo caso de uso ou fluxo em Registrar Adoção com reatribuição de baia e status) – DÚVIDA dos autores.

### B. Perfis e permissões

**Sem divergências em:**
- Os três perfis do Quadro 4 são os três atores das Figuras 1–6 e dos Quadros 16–51; a herança Administrador→Veterinário/Agente Sanitário é idêntica nas seis figuras e no texto 4.1; não existe perfil Recepcionista (Seção 2.2 justifica).

**F1-007 | MÉDIA | INFERÊNCIA**
- Localização A: Quadro 4 (p. 25 conforme sumário) (linha Veterinário)
- Localização B: Quadro 7 (p. 29 conforme sumário) (RF-A02), Figura 3 (p. 40 conforme sumário), Quadro 33 (p. 100 conforme sumário) e Quadro 15 (p. 79 conforme sumário) (T07)
- O que diz A: Veterinário – Módulos com acesso: "Gestão de animais do canil; dashboard; baias e relatórios"
- O que diz B: RF-A02: "O Administrador cadastra e edita as baias"; Figura 3: "Gerenciar Baias" ligado só ao Administrador; T07: "Administrador (edição); Veterinário (consulta)"
- Por que é um problema: O Quadro 4 lista "baias" como módulo do Veterinário sem distinguir consulta de gestão; o restante do documento reserva a gestão ao Administrador.
- Correção sugerida: Reescrever a linha do Veterinário no Quadro 4 (ex.: "consulta de baias") para evitar leitura de permissão de edição.

**F1-008 | MÉDIA | INFERÊNCIA**
- Localização A: Figuras 26 (p. 69 conforme sumário), 28 e 29 (protótipos, usuária "Stéphanie Lima – Veterinária", selo VET)
- Localização B: Quadro 13 (p. 32 conforme sumário) (RN09) e Quadro 15 (p. 79 conforme sumário) (T07–T13)
- O que diz A: Protótipos mostram a usuária VET com menu "Ocorrências", "Processos Sanitários", botão "Abrir Processo Sanitário" (Fig. 28), "Adicionar Baia" (Fig. 29) e dados do denunciante com CPF (Fig. 28)
- O que diz B: RN09: "Veterinário: Gestão de Animais (A) e Dashboard/Relatórios (D)"; Quadro 15: T08–T13 "Agente Sanitário, Administrador"; T07 edição só Administrador
- Por que é um problema: As telas prototipadas exibem, para um perfil Veterinário, funções que RN09 e o Quadro 15 negam a esse perfil. Como protótipo é ilustrativo, é inferência, mas a banca pode ler como contradição de permissões.
- Correção sugerida: Regerar os protótipos com usuário/menu coerentes com RN09 ou registrar na Seção 4.6 que o menu exibido é o do Administrador.

**F1-009 | BAIXA | INFERÊNCIA**
- Localização A: Quadro 13 (p. 32 conforme sumário) (RN09) e Cap. 3 intro (b357)
- Localização B: Figura 17 (p. 58 conforme sumário) (enum Modulo) e Quadro 55 (p. 113 conforme sumário) (CargoPermissao.modulo)
- O que diz A: RN09 identifica módulos por letras: "Gestão de Animais (A)", "Processos (B)", "Dashboard/Relatórios (D)", "Ocorrências (E)"
- O que diz B: Enum Modulo: USUARIOS_ACESSO, GESTAO_ANIMAIS, OCORRENCIAS_DENUNCIAS, PROCESSOS_SANITARIOS, RELATORIOS
- Por que é um problema: Dois esquemas de identificação de módulo coexistem (letras de requisito × valores do enum), sem tabela de correspondência; o módulo 1 não tem letra em RN09.
- Correção sugerida: Acrescentar a correspondência letra ↔ enum (C=USUARIOS_ACESSO, A=GESTAO_ANIMAIS, E=OCORRENCIAS_DENUNCIAS, B=PROCESSOS_SANITARIOS, D=RELATORIOS) no texto de RN09 ou na Seção 3.

### C. Regras de negócio

**Sem divergências em:**
- Todas as 12 RN referenciadas (RN01–RN12) existem no Quadro 13 e todas são citadas fora dele; nenhuma RNF ou RF inexistente é citada.
- RN01 (microchip único): coerente em 1.7, RF-A01, Quadros 23/24, Quadro 67 (UQ), Figura 13 (UQ) e Animal.registrarMicrochip().
- RN05 (bloqueio de encerramento): coerente em RF-E03, Quadro 39, Figura 4 (nota), 5.2 e Ocorrencia.podeSerEncerrada()/ProcessoSanitario.possuiResultado().
- RN10 (notificação Positivo/Inconclusivo ao responsável e à Vigilância Epidemiológica, uma vez): coerente em 1.3, Resumo, RF-B03, Quadro 42, Figura 5 (nota), 5.2, ProcessoSanitario.notificado_em/exigeNotificacao() e ResponsavelProcesso.email/podeReceberNotificacao().
- RN12 (ciclo ABERTO→EM_ANDAMENTO→AGUARDANDO_RESULTADO→CONCLUIDO): coerente com Quadros 42/44, enum StatusProcesso (Fig. 24) e avancarStatus().
- Prazo do alerta vacinal (7 dias): coerente em Resumo, RF-A03, RF-D01, Quadros 29/46/47/56, Apêndice C.

**F1-010 | ALTA | INFERÊNCIA**
- Localização A: Quadro 13 (p. 32 conforme sumário) (RN03)
- Localização B: Quadro 38 (p. 104 conforme sumário) (Fluxo Alternativo I), Figura 4 (p. 41 conforme sumário) (nota) e Figura 22 (p. 63 conforme sumário) (Ocorrencia.denuncianteVisivelPara)
- O que diz A: RN03: "...os dados do denunciante não são exibidos para nenhum perfil exceto Administrador; o acesso do Administrador é registrado em auditoria."
- O que diz B: Quadro 38 Fluxo Alt. I: "Acesso como Administrador: os dados do denunciante são exibidos mesmo em ocorrências sigilosas." (sem registro de auditoria); nota da Fig. 4 e método denuncianteVisivelPara() também não preveem o registro
- Por que é um problema: A segunda metade da RN03 (auditoria do acesso do Administrador, exigência LGPD) não tem passo correspondente no caso de uso nem operação de domínio; o enum AcaoAuditoria tem VISUALIZACAO, mas nada o aciona.
- Correção sugerida: Incluir no Quadro 38 o passo "registra AuditoriaEvento (VISUALIZACAO) quando o Administrador visualiza denunciante de ocorrência sigilosa" e refletir na nota da Figura 4.

**F1-011 | ALTA | INFERÊNCIA**
- Localização A: Quadro 13 (p. 32 conforme sumário) (RN07)
- Localização B: Figura 13 (p. 52 conforme sumário) (tabela Animal) – leitura parcial
- O que diz A: RN07: "Obrigatórios: espécie, sexo, porte, baia, esterilizado, status, motivo de entrada e data de entrada."
- O que diz B: Fig. 13: especie "NN", esterilizado "NN", status_animal "NN"; sexo, porte, data_entrada, motivo_entrada_id e baia_id sem marca NN visível
- Por que é um problema: Cinco dos oito campos obrigatórios por RN07 aparecem sem NOT NULL no diagrama lógico (leitura limitada pela resolução da imagem – ver Limitações). O Quadro 67 não informa nulidade, então o lógico é o único artefato que a expressa.
- Correção sugerida: Marcar NN em sexo, porte, baia_id, motivo_entrada_id e data_entrada na Figura 13 (ou justificar) e, idealmente, indicar nulidade no dicionário.

**F1-012 | ALTA | FATO**
- Localização A: Quadro 13 (p. 32 conforme sumário) (RN08)
- Localização B: Figura 15 (p. 54 conforme sumário) (ProcessoSanitario.laboratorio_id, ResponsavelProcesso.endereco) e Figura 10 (p. 48 conforme sumário) (cardinalidades "(0,1)")
- O que diz A: RN08: "Obrigatórios: data de abertura, doença, laboratório, ao menos uma amostra e os dados mínimos do responsável (nome, endereço)."
- O que diz B: Fig. 15: "laboratorio_id uuid" (sem NN, enquanto doenca_id e responsavel_id têm NN); ResponsavelProcesso "endereco varchar(300)" (sem NN); Fig. 10: "(0,1)" junto a Laboratorio, Doenca e Responsavel_Processo
- Por que é um problema: Laboratório e endereço do responsável são obrigatórios pela regra, mas opcionais no modelo lógico (e, no DER, com cardinalidade mínima zero).
- Correção sugerida: Marcar NN em laboratorio_id e em ResponsavelProcesso.endereco (Fig. 15) e revisar as cardinalidades mínimas da Figura 10.

**F1-013 | ALTA | INFERÊNCIA**
- Localização A: Quadro 7 (p. 29 conforme sumário) (RF-A05)
- Localização B: Quadro 67 (p. 116 conforme sumário) (Animal), Quadro 79 (p. 120 conforme sumário) (Adocao), Figura 13 (p. 52 conforme sumário), Figura 18 (p. 59 conforme sumário)
- O que diz A: RF-A05: "No destino Eutanásia, registrar o laudo do responsável técnico que a justifica (Lei nº 14.228/2021, art. 2º, § 1º)."
- O que diz B: Nenhuma tabela ou classe possui atributo de laudo/justificativa de eutanásia (Animal tem observacoes; AnexoAnimal armazena arquivos genéricos); Quadro 25 (Registrar Saída) não pede laudo
- Por que é um problema: Requisito de alta prioridade e exigência legal sem suporte explícito na modelagem nem no caso de uso de saída.
- Correção sugerida: Acrescentar atributo (ex.: Animal.laudo_eutanasia ou entidade Eutanasia com laudo, responsável técnico e data) e o passo correspondente no Quadro 25.

**F1-014 | MÉDIA | FATO**
- Localização A: Quadro 13 (p. 32 conforme sumário) (RN02), Quadros 8 (p. 30 conforme sumário) e 9 (RF-E01, RF-B01), Figura 5 (p. 42 conforme sumário) (nota), Quadros 35 (p. 102 conforme sumário)/40, Seção 5.2 (b562)
- Localização B: Figura 26 (p. 69 conforme sumário) e Figura 28 (p. 73 conforme sumário) (protótipos)
- O que diz A: RN02: "formato 0000/AAAA, sequencial, reiniciando em 0001 a cada ano civil"
- O que diz B: Fig. 28: "Ocorrência 089/2026" e "Processo Sanitário Vinculado 045/2026"; Fig. 26: "045/2026"
- Por que é um problema: Os protótipos exibem protocolos com três dígitos, contrariando o formato de quatro dígitos fixado por RN02 e repetido em dez pontos do texto.
- Correção sugerida: Atualizar os protótipos para 0089/2026 e 0045/2026 (ou declarar na Seção 4.6 que são ilustrativos).

**F1-015 | MÉDIA | FATO**
- Localização A: Quadro 90 (p. 123 conforme sumário) (ProcessoSanitario.protocolo "varchar(50)") e Quadro 84 (p. 121 conforme sumário) / Figura 14 (p. 53 conforme sumário) (Ocorrencia.protocolo varchar(50))
- Localização B: Figura 15 (p. 54 conforme sumário) (ProcessoSanitario.protocolo "varchar(9) UQ NN")
- O que diz A: Dicionário: protocolo varchar(50) nas duas tabelas
- O que diz B: Lógico M4: protocolo varchar(9)
- Por que é um problema: Tamanho do campo diverge entre o lógico M4 e o dicionário/lógico M3 para o mesmo formato 0000/AAAA (9 caracteres).
- Correção sugerida: Padronizar (varchar(9) é suficiente para 0000/AAAA) nos Quadros 84 e 90 e na Figura 14.

**F1-016 | MÉDIA | DÚVIDA**
- Localização A: Quadro 9 (p. 30 conforme sumário) (RF-B05) e Quadro 13 (p. 32 conforme sumário) (RN04)
- Localização B: Quadro 40 (p. 105 conforme sumário) (Fluxo Alt. I) e Quadro 44 (p. 108 conforme sumário) (Pré-Condições/Restrições)
- O que diz A: RF-B05: "Contato humano em qualquer amostra marca o processo como urgente, com alerta visual. O processo não pode ser concluído sem resultado."; RN04 só trata de urgência e fixação no topo
- O que diz B: Quadro 40: "bloqueia o encerramento sem resultado (RN04, RF-B05)"; Quadro 44: "Processos com contato humano não podem ser encerrados sem resultado (RF-B05)"
- Por que é um problema: Não fica claro se o bloqueio de encerramento sem resultado vale para todo processo (leitura literal de RF-B05 e RN12) ou só para processos urgentes (Quadro 44); além disso o bloqueio é atribuído a RN04, que não o enuncia.
- Correção sugerida: Decidir o alcance do bloqueio e registrá-lo em uma RN (ampliar RN04 ou RN12) citada de forma uniforme em RF-B05, Quadro 40 e Quadro 44.

**F1-017 | MÉDIA | DÚVIDA**
- Localização A: Quadro 13 (p. 32 conforme sumário) (RN06) e Quadro 7 (p. 29 conforme sumário) (RF-A04)
- Localização B: Quadro 32 (p. 100 conforme sumário) (Fluxo Principal) e Figura 20 (p. 61 conforme sumário) (Exame.registrarResultado)
- O que diz A: RN06: "Histórico veterinário, processos e resultados não podem ser excluídos; a correção gera novo registro"; RF-A04: "Registros imutáveis: a correção gera novo registro com auditoria"
- O que diz B: Quadro 32: "Posteriormente, o Veterinário registra o resultado... / Atualiza o exame com o resultado informado."; Quadro 30: altera status da prescrição "mantendo o registro"
- Por que é um problema: Registros clínicos declarados imutáveis são atualizados em etapas (exame recebe resultado depois; prescrição muda de status). O documento não define se "imutável" significa sem UPDATE ou sem exclusão/correção, o que muda a implementação.
- Correção sugerida: Precisar RN06: quais campos podem ser completados depois (resultado do exame, status da prescrição) e o que exige novo registro.

**F1-018 | MÉDIA | FATO**
- Localização A: Quadro 13 (p. 32 conforme sumário) (RN11)
- Localização B: Quadro 9 (p. 30 conforme sumário) (RF-B06), Quadro 45 (p. 108 conforme sumário) e Quadro 91 (p. 124 conforme sumário) (DocumentoProcesso.status "StatusDocumento ... (RN11)")
- O que diz A: RN11 "Estado de Exportação": "RelatorioGerado com estados Pendente→Em Processamento→Concluído/Falha. Binário não armazenado no banco, apenas URL com política de expiração."
- O que diz B: RF-B06: "controle de estado em DocumentoProcesso (Pendente→Em Processamento→Concluído/Falha, RN11)"; Quadro 91 cita RN11 para DocumentoProcesso
- Por que é um problema: RN11 é escrita só para RelatorioGerado, mas é invocada para DocumentoProcesso, que no modelo não tem url_expira_em (RN11 exige URL com expiração).
- Correção sugerida: Generalizar RN11 para "arquivos gerados (RelatorioGerado e DocumentoProcesso)" e decidir se DocumentoProcesso também tem URL com expiração.

**F1-019 | MÉDIA | DÚVIDA**
- Localização A: Quadro 7 (p. 29 conforme sumário) (RF-A03) e Quadro 70 (p. 117 conforme sumário) (Vacinacao.data_validade)
- Localização B: Quadro 29 (p. 98 conforme sumário) (Fluxo Principal) e Figura 19 (p. 60 conforme sumário) (Vacinacao.calcularPrevisaoRetorno)
- O que diz A: RF-A03: alertas "com base na data de validade de cada dose"; Quadro 70: "data_validade: Data de validade da dose; base do alerta de reforço (RF-A03)"
- O que diz B: Quadro 29: "Persiste a vacinação e calcula a previsão de retorno (data de aplicação + intervalo em meses)"; Quadro 62: intervalo_meses "base do alerta RF-A03"; Fig. 19: calcularPrevisaoRetorno(intervaloMeses)
- Por que é um problema: Dois mecanismos distintos são apontados como base do alerta de 7 dias (data de validade informada × data calculada pelo intervalo da vacina); o Quadro 29 não pede a data de validade como entrada e não há atributo "previsao_retorno" em Vacinacao.
- Correção sugerida: Definir uma única base (ex.: data_validade calculada = data_aplicacao + intervalo_meses, editável) e alinhar RF-A03, Quadros 29/62/70 e a Figura 19.

**F1-020 | BAIXA | FATO**
- Localização A: Quadro 13 (p. 32 conforme sumário) (RN06)
- Localização B: Quadro 21 (p. 93 conforme sumário) (usuário), Quadro 22 (p. 94 conforme sumário) (auditoria), Quadros 34 (p. 101 conforme sumário)/37 (anexos)
- O que diz A: RN06 cobre "Histórico veterinário, processos e resultados"
- O que diz B: Quadro 21: "O cadastro [de usuário] não é excluído ... (RN06)"; Quadro 22: "registros de auditoria são imutáveis (RN06)"; Quadros 34/37: "O anexo não pode ser excluído depois de gravado (RN06)"
- Por que é um problema: RN06 é citada para objetos que seu texto não abrange (usuários, eventos de auditoria, anexos de ocorrência).
- Correção sugerida: Ampliar o enunciado de RN06 ou criar RN específica para auditoria/anexos.

**F1-021 | BAIXA | INFERÊNCIA**
- Localização A: Quadro 56 (p. 114 conforme sumário) (PreferenciaUsuario.notif_email_diario)
- Localização B: Quadro 6 (p. 29 conforme sumário) (RF-C03) e Quadro 10 (p. 31 conforme sumário)
- O que diz A: notif_email_diario: "Indica se o usuário recebe por e-mail um resumo diário com os alertas pendentes"
- O que diz B: RF-C03 fala apenas em "notificações que deseja receber"; nenhum RF prevê e-mail diário de resumo
- Por que é um problema: Funcionalidade (resumo diário por e-mail) modelada sem requisito funcional correspondente.
- Correção sugerida: Incluir o resumo diário em RF-C03/RF-D01 ou remover o atributo.

**F1-022 | BAIXA | INFERÊNCIA**
- Localização A: Quadro 13 (p. 32 conforme sumário) (RN02: "reiniciando em 0001")
- Localização B: Seção 2.3.3 (b345)
- O que diz A: RN02 não menciona o controle de concorrência
- O que diz B: 2.3.3: "durante essa transação, a linha da sequência anual fica bloqueada, o que impede números repetidos em cadastros simultâneos (RN02)"
- Por que é um problema: O mecanismo de lock da sequência anual aparece só na seção de tecnologia; a regra não cita a entidade/sequência que o implementa, e nenhum artefato de modelagem (DER, lógico, classes) tem a sequência anual.
- Correção sugerida: Mencionar em RN02 a sequência por ano com bloqueio e, se for tabela/sequence, representá-la no lógico.

### D. Modelagem de dados (DER × lógico × dicionário × classes)

**Sem divergências em:**
- Classes «external» (Usuario, Animal, Laboratorio, Sintoma, Ocorrencia, ProcessoSanitario) correspondem a classes definidas em outro módulo.
- Módulos 3, 4 e 5: dicionário × lógico coincidem em tabelas e colunas (exceto protocolo varchar(9)); Módulo 5 coincide nos quatro artefatos.
- Valores de enumeração: ResultadoLaboratorial, StatusProcesso, StatusAnimal (destinos), StatusRelatorio/StatusDocumento, Especie, TipoAbrigo, TipoRelatorio, Porte, UnidadeFrequencia, TemaUsuario coincidem entre diagramas de classes, descrições do dicionário e texto.
- Tabelas associativas UsuarioCargo, AmostraSintoma, AnimalSintoma e VacinaEspecie são coerentes entre lógico, dicionário e classes (AnimalSintoma e VacinaEspecie faltam só no DER M2 – achado F1 sobre a Figura 8).

**F1-023 | CRÍTICA | FATO**
- Localização A: Figura 7 (p. 45 conforme sumário) (DER M1: entidade Sessao) e Figura 12 (p. 51 conforme sumário) (lógico M1: tabela Sessao)
- Localização B: Seção 2.3.1 (b341), Apêndice B.1 (Quadros 52 (p. 113 conforme sumário)–57) e Figura 17 (p. 58 conforme sumário)
- O que diz A: Fig. 7: entidade "Sessao" (id, token_hash, ip, user_agent, criada_em, expira_em, encerrada_em), relacionamento "abre"; Fig. 12: tabela Sessao com token_hash varchar(512) UQ
- O que diz B: 2.3.1: "A arquitetura é sem estado (stateless): o servidor não mantém a sessão do usuário em memória nem em banco de dados"; dicionário B.1 e diagrama de classes não têm Sessao
- Por que é um problema: DER e lógico persistem sessões (token_hash) enquanto o texto declara arquitetura stateless e o dicionário/classes omitem a tabela: contradição conceitual que leva a implementações opostas. Versão majoritária: texto + dicionário + classes (3 × 2).
- Correção sugerida: Remover Sessao das Figuras 7 e 12 (mantendo JWT stateless) ou, se houver lista de tokens revogados, descrevê-la no texto, no dicionário e nas classes.

**F1-024 | ALTA | FATO**
- Localização A: Quadro 79 (p. 120 conforme sumário) (tabela Adocao), Figura 18 (p. 59 conforme sumário) (classe Adocao) e Quadro 7 (p. 29 conforme sumário) (RF-A05)
- Localização B: Figura 8 (p. 46 conforme sumário) (DER M2) e Figura 13 (p. 52 conforme sumário) (lógico M2)
- O que diz A: Dicionário e classes definem Adocao com 15 atributos; RF-A05 exige "registrar os dados do adotante"
- O que diz B: A Figura 8 não tem entidade Adocao nem atributos de adotante; a Figura 13 não tem tabela Adocao (22 tabelas, nenhuma Adocao)
- Por que é um problema: Entidade presente em dois artefatos e ausente nos dois modelos de dados (conceitual e lógico) do mesmo módulo.
- Correção sugerida: Incluir Adocao (e o relacionamento com Animal e Usuario) nas Figuras 8 e 13.

**F1-025 | ALTA | FATO**
- Localização A: Figura 8 (p. 46 conforme sumário) (Baia.animais_alojados) e Figura 13 (p. 52 conforme sumário) (Baia "animais_alojados integer NN")
- Localização B: Seção 4.4 (b464), Quadro 60 (p. 115 conforme sumário), Quadro 33 (p. 100 conforme sumário) e Figura 18 (p. 59 conforme sumário) (Baia.calcularOcupacao())
- O que diz A: DER e lógico: atributo animais_alojados
- O que diz B: 4.4: "A ocupação das baias não é armazenada: é calculada pela contagem de animais alojados."; Quadro 33: "A ocupação não é digitada: é calculada"; Quadro 60 sem o campo; classe com calcularOcupacao()
- Por que é um problema: DER e lógico armazenam a ocupação que texto, dicionário, caso de uso e classes declaram derivada. Versão majoritária: calculada (4 × 2).
- Correção sugerida: Retirar animais_alojados das Figuras 8 e 13.

**F1-026 | ALTA | FATO**
- Localização A: Figura 8 (p. 46 conforme sumário) (DER M2)
- Localização B: Figura 13 (p. 52 conforme sumário), Apêndice B.2 (Quadros 58 (p. 114 conforme sumário)–79) e Figuras 18 (p. 59 conforme sumário)–20
- O que diz A: Fig. 8: entidade "Medicacao" (medicamento, dose, via_administracao, status...); Exame com atributo "tipo_exame"; Procedimento/Exame com "anexo_url"; Vacina com "especie_aplicavel"; Vacinacao com "dose"; sem Sintoma
- O que diz B: Lógico/dicionário/classes: Prescricao + Medicamento + CategoriaFarmacologica; TipoExame; AnexoVacinacao/AnexoProcedimento/AnexoExame; VacinaEspecie; Vacinacao.numero_dose/dose_quantidade/dose_unidade; Sintoma + AnimalSintoma
- Por que é um problema: O DER conceitual do Módulo 2 representa uma versão anterior do modelo: 11 entidades do lógico/dicionário não existem nele (Adocao, Sintoma, AnimalSintoma, VacinaEspecie, Medicamento, CategoriaFarmacologica, Prescricao, TipoExame, AnexoVacinacao, AnexoProcedimento, AnexoExame) e seus atributos equivalentes estão em outra forma. O texto 4.2 diz que o DER "serviu de base" ao lógico, mas o leitor não consegue derivar um do outro.
- Correção sugerida: Regenerar a Figura 8 a partir do modelo lógico atual (ou documentar na Seção 4.2 as transformações aplicadas).

**F1-027 | ALTA | FATO**
- Localização A: Figura 9 (p. 47 conforme sumário) ("Gera": (0,1)/(0,1)), Figura 15 (p. 54 conforme sumário) (ocorrencia_id nulo), Figura 22 (p. 63 conforme sumário) (Ocorrencia 0..1 — 0..1 ProcessoSanitario), Quadro 9 (p. 30 conforme sumário) (RF-B01 "vínculo opcional")
- Localização B: Figura 10 (p. 48 conforme sumário) ("Origina": "(1,n)" junto a Ocorrencia, "(1,1)" junto a Processo_Sanitario) e Figura 23 (p. 64 conforme sumário) ("Ocorrencia 0..1 —origina— * ProcessoSanitario")
- O que diz A: Vínculo opcional nos dois sentidos, 0..1 para 0..1
- O que diz B: Fig. 10: mínimos 1 nos dois lados (vínculo obrigatório); Fig. 23: uma ocorrência origina vários processos (*)
- Por que é um problema: A mesma associação Ocorrência–Processo tem quatro cardinalidades diferentes nos artefatos. Versão majoritária: processo com 0..1 ocorrência (RF-B01, Fig. 9, 15, 22, 23); número de processos por ocorrência diverge (0..1 na Fig. 22 × * na Fig. 23 × n na Fig. 10).
- Correção sugerida: Fixar: Processo 0..1 Ocorrência; Ocorrência 0..* Processos (ou 0..1) e corrigir Figuras 10, 22 ou 23.

**F1-028 | MÉDIA | FATO**
- Localização A: Figura 8 (p. 46 conforme sumário) (entidade "Usuário") e Figura 14 (p. 53 conforme sumário) (tabela Usuario)
- Localização B: Figura 7 (p. 45 conforme sumário), Figura 12 (p. 51 conforme sumário), Quadro 52 (p. 113 conforme sumário) e Figura 17 (p. 58 conforme sumário)
- O que diz A: Fig. 8: atributos "dois_fatores_ativo" e "data_criacao"; Fig. 14: "dois_fatores_ativo boolean NN"
- O que diz B: Fig. 7/12, Quadro 52 e classe Usuario não têm dois_fatores_ativo nem data_criacao; o texto nunca menciona autenticação de dois fatores
- Por que é um problema: A cópia de Usuario em dois diagramas de outros módulos traz atributos que a definição canônica (M1) não tem; 2FA não é requisito.
- Correção sugerida: Remover dois_fatores_ativo/data_criacao das Figuras 8 e 14 ou incorporá-los em M1 com requisito correspondente.

**F1-029 | MÉDIA | FATO**
- Localização A: Figura 7 (p. 45 conforme sumário), Figura 12 (p. 51 conforme sumário) e Quadro 56 (p. 114 conforme sumário) (PreferenciaUsuario com 5 campos notif_*)
- Localização B: Figura 17 (p. 58 conforme sumário) (classe PreferenciaUsuario)
- O que diz A: DER, lógico e dicionário: notif_alertas_criticos, notif_vacina_vencendo, notif_superlotacao, notif_resultado_lab, notif_email_diario
- O que diz B: Classe PreferenciaUsuario: apenas id, tema, densidade
- Por que é um problema: Cinco atributos presentes em três artefatos faltam no diagrama de classes (RF-C03 e Quadro 18 incluem notificações nas preferências).
- Correção sugerida: Acrescentar os cinco atributos Boolean à classe PreferenciaUsuario (Figura 17).

**F1-030 | MÉDIA | DÚVIDA**
- Localização A: Figura 10 (p. 48 conforme sumário) ("(0,1)" junto a Doenca, Laboratorio, Responsavel_Processo e Usuario; "Amostra" (0,n)/(0,n)); Figura 9 (p. 47 conforme sumário) ("(0,1)" junto a Tipo_Ocorrencia e Usuario)
- Localização B: Figura 15 (p. 54 conforme sumário) (doenca_id NN, responsavel_id NN, criado_por NN), Figura 23 (p. 64 conforme sumário) (Doenca 1, ResponsavelProcesso 1, Laboratorio 1, "avalia 1..*"), RN08
- O que diz A: DER: mínimos zero nos relacionamentos com Doenca/Laboratorio/Responsavel/Usuario; Amostra com (0,n) nos dois lados
- O que diz B: Lógico: FKs NOT NULL; classes: multiplicidade 1 e 1..* amostras; RN08 exige doença, laboratório, responsável e ao menos uma amostra
- Por que é um problema: As cardinalidades mínimas do DER contradizem a obrigatoriedade expressa no lógico, nas classes e em RN08 – ou a convenção de leitura (min,max) usada no brModelo não é a mesma declarada no texto (Seção 1.12 só diz "(mínima, máxima)"). Só os autores podem dizer qual convenção adotaram.
- Correção sugerida: Declarar na Seção 1.12/4.2 a convenção de leitura das cardinalidades e revisar os mínimos das Figuras 9 e 10.

**F1-031 | MÉDIA | FATO**
- Localização A: Figura 9 (p. 47 conforme sumário) ("Registra" Ocorrencia–Denunciado: "(1,1)" junto a Ocorrencia, "(1,n)" junto a Denunciado; "Aponta" Denunciante idem)
- Localização B: Quadro 8 (p. 30 conforme sumário) (RF-E01 "denunciado (opcional)"), Quadro 36 (p. 103 conforme sumário), Figura 14 (p. 53 conforme sumário) (denunciado_id e denunciante_id nulos), Figura 22 (p. 63 conforme sumário) (envolve 0..1 Denunciado; relatada por 0..1 Denunciante)
- O que diz A: DER: mínimo 1 para denunciante e denunciado
- O que diz B: Requisito, caso de uso, lógico e classes: denunciado opcional; lógico e classes: denunciante também opcional
- Por que é um problema: DER torna obrigatórios o denunciado (contraria 4 artefatos) e o denunciante; para o denunciante, o Quadro 35 ("denunciante vinculado" na pós-condição) e o DER o tratam como obrigatório, enquanto lógico e classes o deixam opcional.
- Correção sugerida: Corrigir Denunciado para mínimo 0 na Figura 9; decidir se o denunciante é obrigatório (denúncia anônima?) e alinhar Quadro 35, Figura 14 e Figura 22.

**F1-032 | MÉDIA | FATO**
- Localização A: Figura 10 (p. 48 conforme sumário) (entidade "AnimalAmostrado", atributo "numero_campo"; "Referencia" (1,1)/(1,n) com Animal)
- Localização B: Quadro 92 (p. 125 conforme sumário) (tabela AmostraAnimal), Figura 15 (p. 54 conforme sumário), Figura 23 (p. 64 conforme sumário), Quadro 9 (p. 30 conforme sumário) (RF-B04 "AmostraAnimal"), Quadro 41 (p. 106 conforme sumário)
- O que diz A: DER nomeia AnimalAmostrado, tem numero_campo e referência obrigatória a Animal
- O que diz B: Demais artefatos: AmostraAnimal, sem numero_campo, animal_id opcional ("quando houver"), Animal 0..1
- Por que é um problema: Nome da entidade e um atributo divergem entre o DER e os outros quatro artefatos; a referência ao animal do canil é opcional em todos menos no DER. O "Nº de Campo" aparece na requisição do GAL (Figura 54), o que sugere atributo perdido na transição DER→lógico.
- Correção sugerida: Renomear para AmostraAnimal na Figura 10, ajustar a cardinalidade com Animal e decidir se numero_campo deve existir (Quadro 92).

**F1-033 | MÉDIA | FATO**
- Localização A: Figuras 7 (p. 45 conforme sumário)–10 (DER)
- Localização B: Apêndice B e Figuras 12 (p. 51 conforme sumário)–25
- O que diz A: DER: "Motivo_entrada", "Tipo_Baia", "Status_Animal", "Tipo_Procedimento", "Anexo_Ocorrencia", "Tipo_Ocorrencia", "Movimentacao_Ocorrencia", "Processo_Sanitario", "Documento_Processo", "TipoDocumento_Processo", "Responsavel_Processo", "Usuário" (com acento); catálogos com atributo "codigo"; AnexoAnimal.mime_type; Laboratorio.codigo
- O que diz B: Lógico/dicionário/classes: MotivoEntrada, TipoBaia, TipoProcedimento, AnexoOcorrencia, TipoOcorrencia, MovimentacaoOcorrencia, ProcessoSanitario, DocumentoProcesso, TipoDocumentoProcesso, ResponsavelProcesso, Usuario; catálogos com "nome" e "ativo" (sem codigo, exceto Sintoma/Vacina); AnexoAnimal sem mime_type
- Por que é um problema: Grafia dos nomes de entidades e presença do atributo "codigo" nos catálogos não são uniformes entre o DER e os demais artefatos.
- Correção sugerida: Uniformizar nomes (CamelCase sem acento) e atributos de catálogo no DER.

**F1-034 | MÉDIA | INFERÊNCIA**
- Localização A: Quadro 1 (p. 18 conforme sumário) (doenças: febre maculosa – capivaras e equinos; leptospirose – roedores, bovinos, suínos) e Anexo A/Fig. 62 (sem página: ausente da Lista de Figuras) ("BUGIO")
- Localização B: Figura 21 (p. 62 conforme sumário) (enum Especie: CANINO, FELINO, QUIROPTERO, PRIMATA_NAO_HUMANO) e Quadro 92 (p. 125 conforme sumário) (AmostraAnimal.especie NN)
- O que diz A: O sistema atende processos de febre maculosa, leptospirose e febre amarela, cujos animais envolvidos incluem roedores, capivaras, equinos, bovinos e suínos
- O que diz B: A espécie do animal amostrado é obrigatória e limitada a quatro valores
- Por que é um problema: Processos sanitários com animais fora das quatro espécies do enum não podem ser registrados (ou serão registrados com espécie errada).
- Correção sugerida: Acrescentar valores (ex.: ROEDOR, OUTRO) ao enum Especie ou permitir espécie textual em AmostraAnimal – DÚVIDA dos autores.

**F1-035 | MÉDIA | DÚVIDA**
- Localização A: Figura 7 (p. 45 conforme sumário) (CargoPermissao desenhada como entidade associativa sobre o relacionamento "concede")
- Localização B: Figura 12 (p. 51 conforme sumário) e Quadro 55 (p. 113 conforme sumário) (CargoPermissao com cargo_id FK apenas) e Figura 17 (p. 58 conforme sumário) (Cargo ◆ CargoPermissao)
- O que diz A: No DER, "concede" liga Cargo a uma linha que parte de Usuario (0,1) – a segunda entidade do relacionamento não é identificável com segurança na imagem
- O que diz B: Lógico/dicionário/classes: CargoPermissao pertence só a Cargo (composição), sem ligação com Usuario
- Por que é um problema: A representação de CargoPermissao no DER (relacionamento entre duas entidades) não corresponde à entidade dependente de Cargo dos demais artefatos; a imagem não permite confirmar a segunda entidade (ver Limitações).
- Correção sugerida: Redesenhar CargoPermissao na Figura 7 como entidade ligada só a Cargo, ou confirmar a intenção.

**F1-036 | BAIXA | FATO**
- Localização A: Apêndice B (dicionário) e Figuras 12 (p. 51 conforme sumário)–16
- Localização B: Figuras 17 (p. 58 conforme sumário)–25 (classes)
- O que diz A: Dicionário/lógico: Usuario.senha; Ocorrencia.status_ocorrencia; ProcessoSanitario.status_processo, resultado_laboratorial, desfecho_animal; RelatorioGerado.parametros_jsonb; grafia snake_case (criado_em)
- O que diz B: Classes: Usuario.senhaHash; Ocorrencia.status; ProcessoSanitario.status, resultado, desfecho; RelatorioGerado.parametros; grafia camelCase (criadoEm)
- Por que é um problema: Além da conversão esperada snake_case→camelCase, cinco atributos mudam de nome entre tabela e classe, o que exige mapeamento explícito.
- Correção sugerida: Alinhar os nomes (ex.: senha_hash/senhaHash) ou indicar no texto 4.5 que os nomes de coluna e de atributo podem diferir.

**F1-037 | BAIXA | INFERÊNCIA**
- Localização A: Quadro 57 (p. 114 conforme sumário) / Figura 12 (p. 51 conforme sumário) (AuditoriaEvento: entidade varchar(100), payload_antes, payload_depois)
- Localização B: Quadro 12 (p. 32 conforme sumário) (RNF10) e Quadro 22 (p. 94 conforme sumário)
- O que diz A: AuditoriaEvento identifica a "Entidade afetada pela ação" apenas pelo nome
- O que diz B: RNF10 exige "usuário, data, hora e valores anterior/posterior em toda alteração crítica"; Quadro 22 filtra "por usuário, entidade e período"
- Por que é um problema: Sem identificador do registro afetado (entidade_id), a trilha não permite localizar o histórico de um registro específico (ex.: um animal ou processo).
- Correção sugerida: Acrescentar entidade_id (uuid) a AuditoriaEvento – sugestão.

### E. Relatórios

**Sem divergências em:**
- Os seis relatórios do Quadro 11 coincidem, em nome e quantidade, com o enum TipoRelatorio (Fig. 25), o Quadro 49, o Quadro 94, o protótipo da Figura 30 e as telas T18–T23 do Apêndice E.

**F1-038 | MÉDIA | FATO**
- Localização A: Quadro 10 (p. 31 conforme sumário) (RF-D02) e Quadro 49 (p. 111 conforme sumário)
- Localização B: Figura 30 (p. 77 conforme sumário) (protótipo T14)
- O que diz A: RF-D02: "Gerar, em PDF e CSV, os relatórios..."
- O que diz B: Fig. 30: "Geração e exportação de relatórios consolidados · Resultados disponíveis em PDF, CSV e Excel"; Quadro 14 lista apenas OpenPDF para geração
- Por que é um problema: O protótipo oferece um formato (Excel) que o requisito e a lista de bibliotecas não preveem.
- Correção sugerida: Remover "Excel" do protótipo ou acrescentar o formato (e a biblioteca) a RF-D02 e ao Quadro 14.

**F1-039 | BAIXA | INFERÊNCIA**
- Localização A: Quadro 13 (p. 32 conforme sumário) (RN11) e Figura 25 (p. 66 conforme sumário) (StatusRelatorio)
- Localização B: Figura 30 (p. 77 conforme sumário) ("Geração em curso: 83%", "Ver versão parcial →")
- O que diz A: Estados: Pendente→Em Processamento→Concluído/Falha; RelatorioGerado sem percentual
- O que diz B: Protótipo exibe progresso percentual e "versão parcial" de um relatório em processamento
- Por que é um problema: O protótipo sugere comportamento (progresso e download parcial) sem suporte na regra nem no modelo.
- Correção sugerida: Simplificar o protótipo ou acrescentar progresso ao modelo (atributo e regra).

### F. Telas

**Sem divergências em:**
- Códigos e nomes das telas T01–T17 coincidem entre Quadro 15, legendas das Figuras 31–47 e descrições da Seção 5.2; os cinco protótipos (Figuras 26–30) referem-se a telas existentes (T02, T06, T10, T07, T14).

**F1-040 | ALTA | FATO**
- Localização A: Quadro 15 (p. 79 conforme sumário) ("Telas do SISZOO": linhas T01 a T17)
- Localização B: Apêndice E (Figuras 49 (p. 129 conforme sumário – página da lista refere-se às telas do Ap. E)–54: "Tela T18" a "Tela T23"), Lista de Figuras e Seção 5.2 (b526)
- O que diz A: Quadro 15 termina em T17 "Perfil e Ajuda"
- O que diz B: Apêndice E apresenta T18 Relatório anual de processos, T19 Vacinação, T20 Adoções, T21 Procedimentos, T22 Ocupação de baias, T23 Ocorrências por bairro; 5.2: "As telas dos relatórios específicos... encontram-se no Apêndice E"
- Por que é um problema: Seis telas referenciadas no texto e no apêndice não constam do quadro que "relaciona cada tela aos perfis... requisitos e regras... e à rotina que substitui".
- Correção sugerida: Acrescentar as linhas T18–T23 ao Quadro 15 (perfis "Todos", RF-D02/RF-B07, RN11, "Relatórios montados à mão").

**F1-041 | MÉDIA | FATO**
- Localização A: Quadro 9 (p. 30 conforme sumário) (RF-B06 "Documento PDF") e Quadro 45 (p. 108 conforme sumário) (Gerar Documento do Processo)
- Localização B: Quadro 15 (p. 79 conforme sumário) (coluna "Requisitos e regras")
- O que diz A: RF-B06 e o caso de uso existem (Figura 5)
- O que diz B: Nenhuma linha do Quadro 15 cita RF-B06 (T13 cita RF-B03, RF-B05, RN10, RN12)
- Por que é um problema: Funcionalidade com requisito e caso de uso sem tela declarada; o mesmo ocorre com Consultar Trilha de Auditoria (ver achado A) e com RF-A04/anexos só implicitamente em T06.
- Correção sugerida: Citar RF-B06 na linha T13 (ou criar tela) no Quadro 15.

**F1-042 | MÉDIA | INFERÊNCIA**
- Localização A: Figura 26 (p. 69 conforme sumário) (protótipo T02: baias "Gatil C", "Gatil A", "Externa 2", "Externa 1") e Figura 29 (p. 75 conforme sumário) ("21 baias")
- Localização B: Quadro 7 (p. 29 conforme sumário) (RF-A02), Quadro 28 (p. 98 conforme sumário), Quadro 60 (p. 115 conforme sumário)
- O que diz A: Protótipos usam nomes de baia "Gatil A/C" e "Externa n" e total de 21 baias
- O que diz B: Requisito e dicionário: "BAIA 1–16 internas, E1–E8 (ou E1–E4) externas e CORREDOR" – nenhum "Gatil"
- Por que é um problema: A nomenclatura das baias nos protótipos não corresponde à especificada; com E1–E8 + corredor seriam 25 baias, com E1–E4 seriam 21 (coincidindo com a Fig. 29), o que reforça a dúvida E1–E4 × E1–E8.
- Correção sugerida: Alinhar nomes/quantidade de baias nos protótipos à especificação (ou vice-versa).

**F1-043 | BAIXA | INFERÊNCIA**
- Localização A: Figura 26 (p. 69 conforme sumário) (alertas "3 animais sem avaliação há >30 dias", "10 animais não castrados", "2 novos animais sem ficha completa")
- Localização B: Quadro 10 (p. 31 conforme sumário) (RF-D01) e Quadro 46 (p. 109 conforme sumário)
- O que diz A: Protótipo lista seis tipos de alerta crítico
- O que diz B: RF-D01: "total por StatusAnimal, ocupação de baias, alertas vacinais 7 dias, processos aguardando resultado, processos urgentes e resumo mensal por doença"
- Por que é um problema: Três alertas do protótipo não têm requisito (avaliação periódica, castração pendente, ficha incompleta – este último tem suporte em Animal.temFichaCompleta()).
- Correção sugerida: Incluir os alertas em RF-D01 ou retirá-los do protótipo.

**F1-044 | BAIXA | FATO**
- Localização A: Seção 5.2 (b590: tela T16 "ajusta o tema e a densidade da interface (RF-C03)")
- Localização B: Quadro 6 (p. 29 conforme sumário) (RF-C03) e Quadro 18 (p. 91 conforme sumário)
- O que diz A: Texto da T16 omite as notificações
- O que diz B: RF-C03 e Quadro 18: "tema, densidade da interface e as notificações que deseja receber"
- Por que é um problema: Descrição da tela incompleta em relação ao requisito que ela realiza.
- Correção sugerida: Completar a descrição da T16.

### G. Escopo, tecnologia e coerência geral

**Sem divergências em:**
- Nenhum item da Seção 3.4 aparece como requisito, caso de uso ou entidade (SISSAÚDE/VivoPet/app móvel/portal público ausentes do modelo); a exceção é o mapa no protótipo T10 (achado).
- Tecnologias da Seção 2.3 coincidem com o Quadro 14 e a Seção 5.1; as versões (Java 21, Spring Boot 3, React 18, PostgreSQL 16) aparecem uma única vez e o Quadro 14 não informa versões (sem conflito).
- RNFs coerentes com o texto: RNF02 (~2 GB RAM) com o Apêndice C; RNF03 com idb/IndexedDB; RNF06 com bcrypt/HTTPS/LGPD; RNF10 com AuditoriaEvento.

**F1-045 | MÉDIA | FATO**
- Localização A: Seção 3.4 (b393) e Quadro 11 (p. 31 conforme sumário) (Ocorrências por Bairro)
- Localização B: Figura 28 (p. 73 conforme sumário) (protótipo T10: "LOCALIZAÇÃO APROXIMADA" com mapa e marcador)
- O que diz A: 3.4: "geolocalização e mapas georreferenciados de doenças" fora do escopo; Quadro 11: "mapa de calor tabular, sem georreferenciamento"
- O que diz B: O protótipo da T10 exibe um mapa com localização aproximada da ocorrência
- Por que é um problema: Item declarado fora do escopo aparece em protótipo apresentado como "alta fidelidade" para validação com os usuários.
- Correção sugerida: Retirar o mapa do protótipo T10 ou registrar que é ilustrativo e fora do escopo.

**F1-046 | MÉDIA | FATO**
- Localização A: Figuras 1 (p. 38 conforme sumário), 2, 6, 12; Quadros 6 (p. 29 conforme sumário) e 10; Seções 3.1.1, 3.1.5, A.1, A.5
- Localização B: Figuras 7 (p. 45 conforme sumário), 11, 16, 17, 25; Seções B.1, B.5; Seção 4.4; Figura 17 (p. 58 conforme sumário) (enum Modulo); Seção 5.1
- O que diz A: Módulo 1 "Autenticação e Controle de Acesso"; Módulo 5 "Dashboard e Relatórios"
- O que diz B: Módulo 1 "Usuários e Acesso"; Módulo 5 "Relatórios"; enum USUARIOS_ACESSO/RELATORIOS; pacotes "usuarios"/"relatorios"
- Por que é um problema: Os módulos 1 e 5 têm dois nomes cada ao longo do documento (casos de uso/requisitos × DER/lógico/classes/dicionário).
- Correção sugerida: Adotar um nome por módulo em todas as legendas e títulos (ou explicar a dupla denominação na Seção 4).

**F1-047 | BAIXA | INFERÊNCIA**
- Localização A: Quadro 35 (p. 102 conforme sumário) (Fluxo Principal: "Busca o endereço pelo CEP em serviço externo")
- Localização B: Seção 2.3 / Quadro 14 (p. 78 conforme sumário) e Quadro 12 (p. 32 conforme sumário) (RNF03)
- O que diz A: Caso de uso depende de serviço externo de CEP
- O que diz B: Nenhum serviço de CEP é citado nas tecnologias; RNF03 trata de internet instável
- Por que é um problema: Dependência externa não documentada nas tecnologias nem avaliada frente à instabilidade de rede (há fallback manual no Quadro 35, o que mitiga).
- Correção sugerida: Nomear o serviço (ex.: ViaCEP) na Seção 2.3.4 ou no Quadro 14.

**F1-048 | BAIXA | FATO**
- Localização A: Introdução (b275), Seção 1.4, Quadro 3 (p. 22 conforme sumário), Apêndice D (b1198): "AnimalTag"
- Localização B: Apêndice C (b1008, b1018): "AnimalTech"
- O que diz A: Corpo do texto: plataforma "AnimalTag"
- O que diz B: Transcrição da entrevista: "site da AnimalTech"
- Por que é um problema: Nome da plataforma de microchip grafado de duas formas; como a transcrição é literal, cabe nota explicativa.
- Correção sugerida: Acrescentar nota na transcrição ("AnimalTech [sic]; a plataforma é AnimalTag") ou corrigir.

**F1-049 | BAIXA | DÚVIDA**
- Localização A: Introdução (b275: "95 cães e 15 gatos (segundo a equipe, em 9 jan. 2026)")
- Localização B: Cap. 3 (b357: "95 cães disponíveis para adoção e 18 felinos (16 disponíveis, um adotado e um falecido)")
- O que diz A: 15 gatos (entrevista)
- O que diz B: 18 felinos na planilha, 16 disponíveis
- Por que é um problema: Dois números para a população felina, com fontes diferentes, sem conciliação no texto.
- Correção sugerida: Conciliar ou explicar a diferença (data e fonte) em uma das passagens.

### H. Estrutura e ABNT

**Sem divergências em:**
- Numeração dos quadros (1–94) sequencial, sem lacunas; Lista de Quadros confere com as 94 legendas (títulos e numeração).
- Todas as 94 legendas de quadro e 69 de figura têm "Fonte:".
- Numeração de seções (Introdução, 1–5, Considerações Finais, Referências, Apêndices A–E, Anexo A) coerente; subseções 1.1–1.13, 2.1–2.4, 3.1–3.5, 4.1–4.6, 5.1–5.2, A.1–A.5, B.1–B.5.
- 46 das 48 referências são citadas no texto; todas as citações autor-data localizadas têm referência (exceto as fontes institucionais do achado H sobre "CCZ de Itu (2026)").
- Contagens das Considerações Finais ("20 requisitos funcionais, 10 requisitos não funcionais e 12 regras de negócio ... 36 especificações de baixo nível") conferem: 20 RF (3+5+3+7+2), 10 RNF, 12 RN, 36 Quadros 16–51.

**F1-050 | ALTA | FATO**
- Localização A: Apêndice D (b1205–b1229: "Figura 49 (p. 129 conforme sumário – página da lista refere-se às telas do Ap. E) – Planilha de registro...", "Figura 50 (p. 129 conforme sumário – página da lista refere-se às telas do Ap. E) – Continuação...", "Figura 51 (p. 129 conforme sumário – página da lista refere-se às telas do Ap. E) – Planilha de controle...", "Figura 52 (p. 129 conforme sumário – página da lista refere-se às telas do Ap. E) – Capa de processo...", "Figura 53 (p. 129 conforme sumário – página da lista refere-se às telas do Ap. E) – Ficha de notificação...", "Figura 54 (p. 129 conforme sumário – página da lista refere-se às telas do Ap. E) – Requisição de exame no GAL")
- Localização B: Apêndice E (b1258–b1273: "Figura 49 (p. 129 conforme sumário – página da lista refere-se às telas do Ap. E) – Tela T18...", "Figura 50 (p. 129 conforme sumário – página da lista refere-se às telas do Ap. E) – Tela T19...", "Figura 51 (p. 129 conforme sumário – página da lista refere-se às telas do Ap. E) – Tela T20...", "Figura 52 (p. 129 conforme sumário – página da lista refere-se às telas do Ap. E) – Tela T21...", "Figura 53 (p. 129 conforme sumário – página da lista refere-se às telas do Ap. E) – Tela T22...", "Figura 54 (p. 129 conforme sumário – página da lista refere-se às telas do Ap. E) – Tela T23...")
- O que diz A: Seis fotos numeradas 49 a 54
- O que diz B: Seis telas de relatório também numeradas 49 a 54
- Por que é um problema: Numeração de figuras duplicada (NBR 14724: numeração sequencial única). O Apêndice D continua até a Figura 59 e o Anexo A usa 60–63; as telas do Apêndice E deveriam ser 64–69 (ou vir antes do Apêndice D).
- Correção sugerida: Renumerar as figuras do Apêndice E (64–69) ou reposicionar o apêndice, e atualizar as referências cruzadas.

**F1-051 | ALTA | FATO**
- Localização A: Lista de Figuras (b121–b175): 55 entradas; "Figura 48 (p. 128 conforme sumário) – [DESCRIÇÃO DA FOTOGRAFIA] 128"; "Figura 49 (p. 129 conforme sumário – página da lista refere-se às telas do Ap. E) – Tela T18... 129" a "Figura 54 (p. 129 conforme sumário – página da lista refere-se às telas do Ap. E) – Tela T23... 129"; "Figura 55 (p. 130 conforme sumário) – [PLANILHA E TRECHO APRESENTADO] 130"
- Localização B: Legendas do corpo: 69 legendas, 63 números (1–63); Figuras 48 (p. 128 conforme sumário)–63 com títulos diferentes dos da lista; Figuras 56 (sem página: ausente da Lista de Figuras)–63 ausentes da lista
- O que diz A: Lista de Figuras é texto estático (não há campo TOC nela; o único campo TOC do documento é o do Sumário) com placeholders e títulos antigos
- O que diz B: Corpo tem 63 figuras numeradas, com títulos definitivos nos Apêndices D/E e Anexo A
- Por que é um problema: A Lista de Figuras não é um campo não atualizado: é uma lista digitada/colada manualmente que ficou desatualizada após a inclusão das fotos (48–59) e planilhas (60–63). Oito figuras não constam da lista e oito entradas têm título divergente.
- Correção sugerida: Substituir a lista por campo de índice de ilustrações (Word: Referências → Inserir índice de ilustrações, rótulo "Figura") e atualizá-lo após renumerar o Apêndice E.

**F1-052 | MÉDIA | FATO**
- Localização A: Sumário (b118)
- Localização B: —
- O que diz A: Texto do campo TOC: "No table of contents entries found."
- O que diz B: Os títulos usam os estilos 2, 3 e 4 (Heading 1–3) e o campo TOC está configurado para "Heading 1,1,Heading 2,2,Heading 3,3"
- Por que é um problema: O Sumário está vazio: o campo TOC existe mas não foi atualizado (ou os estilos de título não correspondem aos nomes configurados no campo). Causa aparente: campo não atualizado.
- Correção sugerida: Atualizar o campo (F9) e conferir se os estilos de título são os previstos no campo TOC.

**F1-053 | BAIXA | FATO**
- Localização A: Quadros 6 (p. 29 conforme sumário), 7, 8, 9, 10, 12 e 13 (Cap. 3) e Quadros 16 (p. 90 conforme sumário)–94 (Apêndices A e B)
- Localização B: Texto do Cap. 3 e introduções dos Apêndices A e B
- O que diz A: Os quadros aparecem logo após os títulos de seção, sem frase que os cite ("O Quadro 6 apresenta...")
- O que diz B: Quadros 1–5, 11, 14 e 15 são citados antes de aparecer
- Por que é um problema: NBR 14724 e o padrão institucional exigem que ilustrações e quadros sejam citados no texto antes de sua apresentação; 86 dos 94 quadros não são citados pelo número.
- Correção sugerida: Inserir uma frase de chamada antes de cada quadro (nos apêndices, pode ser uma frase listando os quadros de cada seção).

**F1-054 | BAIXA | FATO**
- Localização A: Figuras 7 (p. 45 conforme sumário)–17, 22, 23, 25 (Cap. 4), Figuras 26 (p. 69 conforme sumário)–30 (Seção 4.6), Figuras 48 (p. 128 conforme sumário)–63 (Apêndices D/E e Anexo A)
- Localização B: Seções 4.2, 4.3, 4.5, 4.6, Apêndices D/E, Anexo A
- O que diz A: Legendas presentes, mas o texto não cita essas figuras pelo número (as Figuras 1–6, 18, 21, 24 e 31–47 são citadas)
- O que diz B: —
- Por que é um problema: Vinte e seis legendas de figura (incluindo as duplicadas) não são chamadas no texto; nas seções 4.2/4.3/4.5 os parágrafos descrevem a notação mas não referenciam "Figura N".
- Correção sugerida: Acrescentar chamadas ("A Figura 7 apresenta o DER do Módulo 1...").

**F1-055 | BAIXA | FATO**
- Localização A: Referências (b682 "RECHARTS. Recharts. [S. l.], 2026"; b684 "RIBEIRO, Rodrigo Luiz. Prefeitura lança site do CCZ...")
- Localização B: Corpo do texto (Quadro 14 (p. 78 conforme sumário) cita "Recharts" sem (RECHARTS, 2026); Seção 1.9 e Quadro 2 (p. 22 conforme sumário) citam "Site do CCZ de São José dos Campos (2022)" sem (RIBEIRO, 2022))
- O que diz A: Duas referências na lista
- O que diz B: Nenhuma citação correspondente no texto
- Por que é um problema: NBR 6023/10520: toda referência listada deve ser citada. As demais 46 referências foram localizadas em citações.
- Correção sugerida: Citar (RECHARTS, 2026) no texto da Seção 5.1 e (RIBEIRO, 2022) na Seção 1.9/Quadro 2.

**F1-056 | BAIXA | FATO**
- Localização A: Seção 1.9 (b307)
- Localização B: Quadro 2 (p. 22 conforme sumário) e referência RIBEIRO (2022)
- O que diz A: Parágrafo inicia: "“Eu Adoto no CCZ”, que exibe os animais disponíveis para adoção (SÃO PAULO, 2017)."
- O que diz B: Quadro 2 lista antes o "Site do CCZ de São José dos Campos (2022)"
- Por que é um problema: A primeira frase da Seção 1.9 está truncada: falta o início que apresentaria o site de São José dos Campos (e a citação a RIBEIRO, 2022).
- Correção sugerida: Restaurar o trecho inicial do parágrafo.

**F1-057 | BAIXA | DÚVIDA**
- Localização A: Fontes das Figuras 60 (sem página: ausente da Lista de Figuras)–63: "Fonte: Centro de Controle de Zoonoses de Itu (2026)."; Fontes dos Quadros 3 (p. 22 conforme sumário), 6–9, 12, 13: "com base em entrevista com a equipe do CCZ de Itu (2026)"
- Localização B: Lista de referências
- O que diz A: Fonte no formato autor-data
- O que diz B: Não há entrada "CENTRO DE CONTROLE DE ZOONOSES DE ITU. 2026" nas referências
- Por que é um problema: Planilhas cedidas e entrevista são documentos não publicados; a NBR 10520 admite citá-los como "informação verbal/documento não publicado" em nota, mas o formato autor-data usado sugere referência inexistente.
- Correção sugerida: Decidir entre nota de rodapé ("documento não publicado, cedido pelo CCZ") ou entrada nas referências.

**F1-058 | BAIXA | FATO**
- Localização A: Figuras 60 (sem página: ausente da Lista de Figuras)–63 (b1281, b1286, b1291, b1296)
- Localização B: Demais 65 legendas
- O que diz A: Legendas com hífen: "Figura 60 - Trecho da planilha..."
- O que diz B: Legendas com travessão: "Figura 59 – Gráficos..."
- Por que é um problema: Separador da legenda não uniforme (hífen × travessão).
- Correção sugerida: Trocar por travessão.

**F1-059 | BAIXA | FATO**
- Localização A: Apêndice D (b1208)
- Localização B: b1209
- O que diz A: Fim do parágrafo: "...mantidos manualmente.Figura 50 – Planilha de animais do canil com marcação por cores"
- O que diz B: Legenda real seguinte: "Figura 50 – Continuação da planilha de animais do canil"
- Por que é um problema: Fragmento de legenda antiga colado no parágrafo descritivo (sem espaço após o ponto), que ainda faz a Figura 50 parecer "citada".
- Correção sugerida: Apagar o fragmento.

**F1-060 | BAIXA | FATO**
- Localização A: Apêndice D: Fontes em b1211, b1216, b1221, b1226, b1231, b1235, b1239, b1248, b1254
- Localização B: Demais fontes do documento
- O que diz A: "Fonte: Acervo dos autores (2026)" sem ponto final
- O que diz B: "Fonte: Elaborado pelos autores (2026)." com ponto
- Por que é um problema: Nove indicações de fonte sem ponto final; Figura 56 tem espaço duplo após o travessão ("Figura 56 –  Requisição").
- Correção sugerida: Padronizar.

**F1-061 | BAIXA | FATO**
- Localização A: Lista de Abreviaturas e Siglas (b89–b115)
- Localização B: Quadros 12 (p. 32 conforme sumário), 13, 52–94 e Seção 4.3
- O que diz A: Lista tem "RF – Requisito Funcional" mas não tem RN, RNF, PK, FK, UQ, NN, UML? (tem), E2E
- O que diz B: Siglas RN, RNF, PK, FK, UQ e NN são usadas extensivamente
- Por que é um problema: Siglas usadas no texto não constam da lista de abreviaturas (NBR 14724, elemento opcional, mas incompleto quando presente).
- Correção sugerida: Acrescentar RN, RNF, PK, FK, UQ, NN (e E2E).

## 3. DÚVIDAS que só os autores podem decidir

- **F1-006** (A, BAIXA): A devolução é tratada apenas como fluxo alternativo de "Registrar Adoção", que por sua vez é extensão de "Registrar Saída/Desfecho"; após a devolução o animal volta ao canil, mas não há caso de uso nem fluxo de reentrada (baia, status). → Explicitar a devolução (novo caso de uso ou fluxo em Registrar Adoção com reatribuição de baia e status) – DÚVIDA dos autores.
- **F1-016** (C, MÉDIA): Não fica claro se o bloqueio de encerramento sem resultado vale para todo processo (leitura literal de RF-B05 e RN12) ou só para processos urgentes (Quadro 44); além disso o bloqueio é atribuído a RN04, que não o enuncia. → Decidir o alcance do bloqueio e registrá-lo em uma RN (ampliar RN04 ou RN12) citada de forma uniforme em RF-B05, Quadro 40 e Quadro 44.
- **F1-017** (C, MÉDIA): Registros clínicos declarados imutáveis são atualizados em etapas (exame recebe resultado depois; prescrição muda de status). O documento não define se "imutável" significa sem UPDATE ou sem exclusão/correção, o que muda a implementação. → Precisar RN06: quais campos podem ser completados depois (resultado do exame, status da prescrição) e o que exige novo registro.
- **F1-019** (C, MÉDIA): Dois mecanismos distintos são apontados como base do alerta de 7 dias (data de validade informada × data calculada pelo intervalo da vacina); o Quadro 29 não pede a data de validade como entrada e não há atributo "previsao_retorno" em Vacinacao. → Definir uma única base (ex.: data_validade calculada = data_aplicacao + intervalo_meses, editável) e alinhar RF-A03, Quadros 29/62/70 e a Figura 19.
- **F1-030** (D, MÉDIA): As cardinalidades mínimas do DER contradizem a obrigatoriedade expressa no lógico, nas classes e em RN08 – ou a convenção de leitura (min,max) usada no brModelo não é a mesma declarada no texto (Seção 1.12 só diz "(mínima, máxima)"). Só os autores podem dizer qual convenção adotaram. → Declarar na Seção 1.12/4.2 a convenção de leitura das cardinalidades e revisar os mínimos das Figuras 9 e 10.
- **F1-034** (D, MÉDIA): Processos sanitários com animais fora das quatro espécies do enum não podem ser registrados (ou serão registrados com espécie errada). → Acrescentar valores (ex.: ROEDOR, OUTRO) ao enum Especie ou permitir espécie textual em AmostraAnimal – DÚVIDA dos autores.
- **F1-035** (D, MÉDIA): A representação de CargoPermissao no DER (relacionamento entre duas entidades) não corresponde à entidade dependente de Cargo dos demais artefatos; a imagem não permite confirmar a segunda entidade (ver Limitações). → Redesenhar CargoPermissao na Figura 7 como entidade ligada só a Cargo, ou confirmar a intenção.
- **F1-049** (G, BAIXA): Dois números para a população felina, com fontes diferentes, sem conciliação no texto. → Conciliar ou explicar a diferença (data e fonte) em uma das passagens.
- **F1-057** (H, BAIXA): Planilhas cedidas e entrevista são documentos não publicados; a NBR 10520 admite citá-los como "informação verbal/documento não publicado" em nota, mas o formato autor-data usado sugere referência inexistente. → Decidir entre nota de rodapé ("documento não publicado, cedido pelo CCZ") ou entrada nas referências.
- Convenção de leitura das cardinalidades (min,max) do brModelo (Seção 1.12 não a declara): decide a interpretação de vários mínimos nas Figuras 7–10.
- Denunciante obrigatório ou opcional (denúncia anônima?): Quadro 35 e DER dizem obrigatório; lógico e classes, opcional.
- Quantidade de baias externas (E1–E8 × E1–E4) e nomes das baias ("Gatil") nos protótipos.
- Alcance do bloqueio de encerramento de processo sem resultado (todos os processos × só urgentes).
- Base do alerta vacinal (data de validade informada × data calculada pelo intervalo da vacina).
- Significado de "imutável" em RN06 (sem exclusão/correção × sem qualquer atualização).

## 4. Limitações

- **Figura 13 (lógico M2, image13.png 1385×1031)**: texto muito pequeno; as marcas NN de sexo, porte, data_entrada, motivo_entrada_id e baia_id foram lidas como ausentes em recortes na resolução original, mas a leitura não é segura (achado sobre RN07 classificado como INFERÊNCIA). Baia.animais_alojados e os tipos das colunas foram lidos com segurança.
- **Figura 8 (DER M2, image8.png 1382×902)**: lido por seis recortes; nomes de entidades/atributos legíveis; as cardinalidades menores de alguns relacionamentos (Cadastra, Aplica, Executa, Prescrita) não foram transcritas.
- **Figura 7**: a segunda entidade ligada ao relacionamento "concede" (CargoPermissao) não pôde ser identificada com segurança (linha passa por trás de "produz").
- **Figura 52 (foto da capa de processo)**: o carimbo parece "002 05/01/26", enquanto o texto diz "numerado (007)"; a foto não permite confirmar.
- **Convenção (min,max)**: o documento só diz "cardinalidades no formato (mínima, máxima)"; a transcrição registra a posição literal e os achados de cardinalidade dependentes de convenção estão marcados como DÚVIDA.
- **Páginas**: o Sumário está vazio e as listas pré-textuais são estáticas; as páginas citadas vêm dessas listas e podem estar desatualizadas (as Figuras 56–63 não têm página; as Figuras 49–54 têm a página das telas do Ap. E).
- **Figuras sem imagem (23)**: 31–47 e 49–54 (Ap. E) são placeholders "[INSERIR CAPTURA...]"; nada foi verificado sobre as telas implementadas.
- **Apêndice C (transcrição da entrevista)**: lido integralmente, usado apenas como contexto; não é artefato de especificação.
- **Mapeamento figura→imagem**: todas as 46 imagens foram associadas pela ordem no document.xml (legenda imediatamente antes da imagem; "Fonte:" imediatamente depois); nenhuma associação ficou ambígua. Tabela completa em `figuras/mapeamento_figuras.csv`.

## 5. PENDÊNCIAS (placeholders e capturas ausentes – fora da contagem de inconsistências)

| ID | Localização | Texto literal | Impacto |
|---|---|---|---|
| P-001 | Seção 5.2, Figuras 31 (p. 80 conforme sumário)–47 (b532–b596) | 17 parágrafos "[INSERIR CAPTURA DA TELA T01 – LOGIN]" ... "[INSERIR CAPTURA DA TELA T17 – PERFIL E AJUDA]" | Nenhuma tela implementada é mostrada no capítulo "Sistema desenvolvido"; as Figuras 31–47 não têm imagem. |
| P-002 | Apêndice E, Figuras 49 (p. 129 conforme sumário – página da lista refere-se às telas do Ap. E)–54 (b1259–b1274) | 6 parágrafos "[INSERIR CAPTURA DA TELA T18 – ...]" a "[... T23 – ...]" | Telas de relatório sem imagem. |
| P-003 | Considerações finais (b601, b603, b604) | "[DESCREVER O QUE FOI IMPLEMENTADO E O QUE FICOU PENDENTE NA ENTREGA.]", "[DESCREVER OS TESTES REALIZADOS E SEUS RESULTADOS, SE HOUVER.]", "[APRENDIZADOS E DIFICULDADES, NAS PALAVRAS DOS AUTORES.]", "[ACRESCENTAR REQUISITOS NÃO IMPLEMENTADOS, SE HOUVER.]" | Quatro trechos a redigir; o objetivo específico "e) realizar testes funcionais" fica sem evidência no texto. |
| P-004 | Lista de Figuras (b168, b175) | "Figura 48 – [DESCRIÇÃO DA FOTOGRAFIA]" e "Figura 55 – [PLANILHA E TRECHO APRESENTADO]" | Placeholders na lista pré-textual (ver achado H sobre a lista). |
| P-005 | Quadro 5 (p. 28 conforme sumário) / Seção 2.4 (b355) | "a Sprint S6 (Resultado e e-mail) em andamento. As demais sprints seguem planejadas" | Texto declara desenvolvimento em curso (S7 dashboard, S8 testes E2E, S9 entrega); coerente com as capturas ausentes, mas o Cap. 5 se intitula "Sistema desenvolvido". |

## 6. Mapeamento figura → imagem embutida

| Figura | Seção | Arquivo | Placeholder | p. (conf. sumário) |
|---|---|---|---|---|
| 1 – Diagrama de casos de uso geral do SISZOO | 4.1 DIAGRAMAS DE CASOS DE US | image1.png | — | 38 |
| 2 – Diagrama de casos de uso – Módulo 1: Autenticação e Controle | 4.1 DIAGRAMAS DE CASOS DE US | image2.png | — | 39 |
| 3 – Diagrama de casos de uso – Módulo 2: Gestão de Animais do Ca | 4.1 DIAGRAMAS DE CASOS DE US | image3.png | — | 40 |
| 4 – Diagrama de casos de uso – Módulo 3: Ocorrências e Denúncias | 4.1 DIAGRAMAS DE CASOS DE US | image4.png | — | 41 |
| 5 – Diagrama de casos de uso – Módulo 4: Processos Sanitários | 4.1 DIAGRAMAS DE CASOS DE US | image5.png | — | 42 |
| 6 – Diagrama de casos de uso – Módulo 5: Dashboard e Relatórios | 4.1 DIAGRAMAS DE CASOS DE US | image6.png | — | 43 |
| 7 – DER conceitual – Módulo 1: Usuários e Acesso | 4.2 DIAGRAMAS ENTIDADE-RELAC | image7.png | — | 45 |
| 8 – DER conceitual – Módulo 2: Gestão de Animais do Canil | 4.2 DIAGRAMAS ENTIDADE-RELAC | image8.png | — | 46 |
| 9 – DER conceitual – Módulo 3: Ocorrências e Denúncias | 4.2 DIAGRAMAS ENTIDADE-RELAC | image9.png | — | 47 |
| 10 – DER conceitual – Módulo 4: Processos Sanitários | 4.2 DIAGRAMAS ENTIDADE-RELAC | image10.png | — | 48 |
| 11 – DER conceitual – Módulo 5: Relatórios | 4.2 DIAGRAMAS ENTIDADE-RELAC | image11.png | — | 49 |
| 12 – Diagrama lógico – Módulo 1: Autenticação e Controle de Acess | 4.3 DIAGRAMAS LÓGICOS | image12.png | — | 51 |
| 13 – Diagrama lógico – Módulo 2: Gestão de Animais do Canil | 4.3 DIAGRAMAS LÓGICOS | image13.png | — | 52 |
| 14 – Diagrama lógico – Módulo 3: Ocorrências e Denúncias | 4.3 DIAGRAMAS LÓGICOS | image14.png | — | 53 |
| 15 – Diagrama lógico – Módulo 4: Processos Sanitários | 4.3 DIAGRAMAS LÓGICOS | image15.png | — | 54 |
| 16 – Diagrama lógico – Módulo 5: Relatórios | 4.3 DIAGRAMAS LÓGICOS | image16.png | — | 55 |
| 17 – Diagrama de classes – Módulo 1: Usuários e Acesso | 4.5 DIAGRAMAS DE CLASSE | image17.png | — | 58 |
| 18 – Diagrama de classes – Módulo 2: animal, baias e adoção | 4.5 DIAGRAMAS DE CLASSE | image18.png | — | 59 |
| 19 – Diagrama de classes – Módulo 2: vacinação e prescrição | 4.5 DIAGRAMAS DE CLASSE | image19.png | — | 60 |
| 20 – Diagrama de classes – Módulo 2: procedimentos, exames e sint | 4.5 DIAGRAMAS DE CLASSE | image20.png | — | 61 |
| 21 – Diagrama de classes – Módulo 2: enumerações | 4.5 DIAGRAMAS DE CLASSE | image21.png | — | 62 |
| 22 – Diagrama de classes – Módulo 3: Ocorrências e Denúncias | 4.5 DIAGRAMAS DE CLASSE | image22.png | — | 63 |
| 23 – Diagrama de classes – Módulo 4: Processos Sanitários | 4.5 DIAGRAMAS DE CLASSE | image23.png | — | 64 |
| 24 – Diagrama de classes – Módulo 4: enumerações | 4.5 DIAGRAMAS DE CLASSE | image24.png | — | 65 |
| 25 – Diagrama de classes – Módulo 5: Relatórios | 4.5 DIAGRAMAS DE CLASSE | image25.png | — | 66 |
| 26 – Protótipo da tela T02: Dashboard operacional | 4.6 PROTOTIPAÇÃO DAS INTERFA | image26.png | — | 69 |
| 27 – Protótipo da tela T06: Ficha do animal | 4.6 PROTOTIPAÇÃO DAS INTERFA | image27.png | — | 71 |
| 28 – Protótipo da tela T10: Detalhe da ocorrência | 4.6 PROTOTIPAÇÃO DAS INTERFA | image28.png | — | 73 |
| 29 – Protótipo da tela T07: Gestão de baias | 4.6 PROTOTIPAÇÃO DAS INTERFA | image29.png | — | 75 |
| 30 – Protótipo da tela T14: Central de relatórios | 4.6 PROTOTIPAÇÃO DAS INTERFA | image30.png | — | 77 |
| 31 – Tela T01: Login | 5.2 TELAS DO SISTEMA | — | [INSERIR CAPTURA DA TELA T01 – LOGIN] | 80 |
| 32 – Tela T02: Dashboard operacional | 5.2 TELAS DO SISTEMA | — | [INSERIR CAPTURA DA TELA T02 – DASHBOARD OPER | 80 |
| 33 – Tela T03: Alertas | 5.2 TELAS DO SISTEMA | — | [INSERIR CAPTURA DA TELA T03 – ALERTAS] | 80 |
| 34 – Tela T04: Animais do canil | 5.2 TELAS DO SISTEMA | — | [INSERIR CAPTURA DA TELA T04 – ANIMAIS DO CAN | 80 |
| 35 – Tela T05: Cadastro de animal | 5.2 TELAS DO SISTEMA | — | [INSERIR CAPTURA DA TELA T05 – CADASTRO DE AN | 81 |
| 36 – Tela T06: Ficha do animal | 5.2 TELAS DO SISTEMA | — | [INSERIR CAPTURA DA TELA T06 – FICHA DO ANIMA | 81 |
| 37 – Tela T07: Gestão de baias | 5.2 TELAS DO SISTEMA | — | [INSERIR CAPTURA DA TELA T07 – GESTÃO DE BAIA | 81 |
| 38 – Tela T08: Ocorrências | 5.2 TELAS DO SISTEMA | — | [INSERIR CAPTURA DA TELA T08 – OCORRÊNCIAS] | 81 |
| 39 – Tela T09: Registro de ocorrência | 5.2 TELAS DO SISTEMA | — | [INSERIR CAPTURA DA TELA T09 – REGISTRO DE OC | 81 |
| 40 – Tela T10: Detalhe da ocorrência | 5.2 TELAS DO SISTEMA | — | [INSERIR CAPTURA DA TELA T10 – DETALHE DA OCO | 81 |
| 41 – Tela T11: Processos sanitários | 5.2 TELAS DO SISTEMA | — | [INSERIR CAPTURA DA TELA T11 – PROCESSOS SANI | 82 |
| 42 – Tela T12: Abertura de processo | 5.2 TELAS DO SISTEMA | — | [INSERIR CAPTURA DA TELA T12 – ABERTURA DE PR | 82 |
| 43 – Tela T13: Detalhe do processo | 5.2 TELAS DO SISTEMA | — | [INSERIR CAPTURA DA TELA T13 – DETALHE DO PRO | 82 |
| 44 – Tela T14: Central de relatórios | 5.2 TELAS DO SISTEMA | — | [INSERIR CAPTURA DA TELA T14 – CENTRAL DE REL | 82 |
| 45 – Tela T15: Usuários | 5.2 TELAS DO SISTEMA | — | [INSERIR CAPTURA DA TELA T15 – USUÁRIOS] | 82 |
| 46 – Tela T16: Configurações | 5.2 TELAS DO SISTEMA | — | [INSERIR CAPTURA DA TELA T16 – CONFIGURAÇÕES] | 82 |
| 47 – Tela T17: Perfil e Ajuda | 5.2 TELAS DO SISTEMA | — | [INSERIR CAPTURA DA TELA T17 – PERFIL E AJUDA | 83 |
| 48 – Ficha física de controle do canil | APÊNDICE D – REGISTRO FOTOGR | image31.jpeg | — | 128 |
| 49 – Planilha de registro dos animais do canil | APÊNDICE D – REGISTRO FOTOGR | image32.jpeg | — | 129 |
| 50 – Continuação da planilha de animais do canil | APÊNDICE D – REGISTRO FOTOGR | image33.jpeg | — | 129 |
| 51 – Planilha de controle dos processos sanitários | APÊNDICE D – REGISTRO FOTOGR | image34.jpeg | — | 129 |
| 52 – Capa de processo sanitário em manuseio | APÊNDICE D – REGISTRO FOTOGR | image35.jpeg | — | 129 |
| 53 – Ficha de notificação de cão com suspeita de leishmaniose vis | APÊNDICE D – REGISTRO FOTOGR | image36.jpeg | — | 129 |
| 54 – Requisição de exame no GAL | APÊNDICE D – REGISTRO FOTOGR | image37.jpeg | — | 129 |
| 55 – Etiqueta de protocolo do GAL | APÊNDICE D – REGISTRO FOTOGR | image38.jpeg | — | 130 |
| 56 – Requisição de exame molecular e notificação no SINAN | APÊNDICE D – REGISTRO FOTOGR | image39.jpeg | — | — |
| 57 – Folha de coleta e exame laboratorial | APÊNDICE D – REGISTRO FOTOGR | image40.jpeg | — | — |
| 58 – Gráficos de casos suspeitos de zoonoses afixados em mural | APÊNDICE D – REGISTRO FOTOGR | image41.jpeg | — | — |
| 59 – Gráficos de resultados laboratoriais afixados em mural | APÊNDICE D – REGISTRO FOTOGR | image42.jpeg | — | — |
| 49 – Tela T18: Relatório anual de processos | APÊNDICE E – TELAS DOS RELAT | — | [INSERIR CAPTURA DA TELA T18 – RELATÓRIO ANUA | 129 |
| 50 – Tela T19: Relatório de vacinação | APÊNDICE E – TELAS DOS RELAT | — | [INSERIR CAPTURA DA TELA T19 – RELATÓRIO DE V | 129 |
| 51 – Tela T20: Relatório de adoções | APÊNDICE E – TELAS DOS RELAT | — | [INSERIR CAPTURA DA TELA T20 – RELATÓRIO DE A | 129 |
| 52 – Tela T21: Relatório de procedimentos | APÊNDICE E – TELAS DOS RELAT | — | [INSERIR CAPTURA DA TELA T21 – RELATÓRIO DE P | 129 |
| 53 – Tela T22: Relatório de ocupação de baias | APÊNDICE E – TELAS DOS RELAT | — | [INSERIR CAPTURA DA TELA T22 – RELATÓRIO DE O | 129 |
| 54 – Tela T23: Relatório de ocorrências por bairro | APÊNDICE E – TELAS DOS RELAT | — | [INSERIR CAPTURA DA TELA T23 – RELATÓRIO DE O | 129 |
| 60 – Trecho da planilha “Animais do Canil” | ANEXO A – PLANILHAS DE CONTR | image43.png | — | — |
| 61 – Trecho da planilha “Animais do Canil”: cães e gatos por situ | ANEXO A – PLANILHAS DE CONTR | image44.png | — | — |
| 62 – Trecho da planilha “Controle de Processos Zoonoses”: process | ANEXO A – PLANILHAS DE CONTR | image45.png | — | — |
| 63 – Trecho da planilha “Controle de Processos Zoonoses”: process | ANEXO A – PLANILHAS DE CONTR | image46.png | — | — |

## 7. Arquivos intermediários

- `scripts/extrair_docx.py`, `recortar_figuras.py`, `cruzamentos.py`, `dados_diagramas.py`, `dados_achados.py`, `gerar_saidas.py`
- `texto/documento_completo.md`, `texto/blocos.json`, `texto/listas_pre_textuais.json`, `texto/notas_leitura_texto.md`, `texto/cruzamentos_automaticos.json`, `texto/inventario_bruto_quadros.json`
- `quadros/quadro_01.csv` … `quadro_94.csv`, `quadros/quadros.json`
- `figuras/image1–46`, `figuras/mapeamento_figuras.csv`, `figuras/figuras.json`, `figuras/recortes/`, `figuras/transcricoes/`
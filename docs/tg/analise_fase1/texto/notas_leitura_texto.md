# Notas da leitura do texto (Etapa 0/2) – candidatos a achados e fatos de apoio

Referências de bloco (bNNN) = índice em texto/blocos.json; linha = documento_completo.md.

## Estrutura / ABNT
- b118 SUMÁRIO: campo TOC retorna "No table of contents entries found." (campo não atualizado; único fldChar do doc).
- Lista de Figuras (b121–b175): texto estático (sem campo), 55 entradas (1–55); 48 = "[DESCRIÇÃO DA FOTOGRAFIA]", 55 = "[PLANILHA E TRECHO APRESENTADO]"; 49–54 listadas como Telas T18–T23 (p.129) — no corpo, 49–54 são fotos do Apêndice D E telas do Apêndice E (duplicidade); 56–63 ausentes da lista.
- Lista de Quadros: 94 entradas, coerente com legendas.
- Figuras 60–63 (Anexo A) usam hífen "-" em vez de travessão "–".
- b1208: fragmento "Figura 50 – Planilha de animais do canil com marcação por cores" colado no fim de parágrafo, antes da legenda real da Figura 50 (b1209).
- b1237: "Figura 56 –  Requisição" (espaço duplo).
- Fontes do Apêndice D sem ponto final em várias (b1211, b1216, b1221, b1226, b1231, b1235, b1239, b1248, b1254).
- Seção 1.9 (b307) começa no meio da frase: "“Eu Adoto no CCZ”, que exibe..." — trecho inicial (S. José dos Campos / RIBEIRO, 2022) ausente; RIBEIRO (2022) e RECHARTS (2026) constam nas referências mas aparentemente não são citados no texto (verificar via script).
- Lista de abreviaturas: tem RF, falta RN, RNF, PK/FK/UQ, NN.
- Considerações finais com placeholders: b601 "[DESCREVER O QUE FOI IMPLEMENTADO...]" "[DESCREVER OS TESTES...]"; b603 "[APRENDIZADOS...]"; b604 "[ACRESCENTAR REQUISITOS NÃO IMPLEMENTADOS...]".
- Capturas de tela: 23 placeholders "[INSERIR CAPTURA DA TELA ...]" (Fig. 31–47, Ap. E 49–54).
- Nome da plataforma: corpo usa "AnimalTag"; transcrição (Ap. C, b1008, b1018) usa "AnimalTech".

## Perfis / casos de uso / telas
- b357: mapeamento letras→módulos: RF-C=M1, RF-A=M2, RF-E=M3, RF-B=M4, RF-D=M5. Quadros 6–10 e RN09 coerentes com isso.
- Quadro 15 lista só T01–T17; T18–T23 aparecem apenas em Ap. E/Lista de Figuras (sem linha no Quadro 15).
- Quadro 15 T03 Alertas: Perfis "Todos"; Quadro 47 Consultar Alertas Vacinais: Ator Veterinário; RN09 dá RF-A03 (módulo A) só a Veterinário/Admin.
- Quadro 22 Consultar Trilha de Auditoria: não há RF específico (cita RF-C02) e não há tela em Quadro 15.
- Quadro 15 T16 texto (b590) só "tema e densidade"; RF-C03/Quadro 18 incluem notificações.
- Quadro 46 Dashboard ator "Veterinário ou Agente Sanitário" (Admin por herança) ok.
- RF-A02: "E1–E8 externas"; b357: "baias externas E1 a E8"; Quadro 28 e Quadro 60: "E1–E4".
- Quadro 4 Veterinário: "Gestão de animais do canil; dashboard; baias e relatórios" — Gerenciar Baias é do Administrador (Quadro 33, RF-A02, T07).
- Quadro 19 Resumo: "cadastra, edita e atribui cargos"; RF-C02 inclui desativa/reativa (Quadro 21 extensão) ok.
- Quadro 20 "Caso de Uso Geral: Gerenciar Usuários (inclusão)" → include; Quadro 21 "(extensão)" → extend; Quadro 26 extensão de Registrar Saída; Quadro 34 extensão de Vacina/Procedimento/Exame; Quadro 36, 37 extensão de Registrar Nova Ocorrência; Quadro 47, 48 extensão de Dashboard. Comparar com setas das Fig. 2–6.
- Quadro 35: busca CEP "em serviço externo" — serviço não citado em tecnologias (2.3/Quadro 14).

## Regras de negócio
- RN02 "0000/AAAA" coerente em RF-E01, RF-B01, Quadros 35/40, telas; Intro "0173/2025"; Ap. D "(007)".
- RN03: exige registro em auditoria do acesso do Admin; Quadro 38 Fluxo Alt I (acesso Admin) não menciona auditoria; verificar enum AcaoAuditoria (Fig. 17) para ação de acesso a dado sigiloso.
- RN04 vs RF-B05: RF-B05 acrescenta "não pode ser concluído sem resultado"; RN04 só urgência+topo. Quadro 40 cita (RN04, RF-B05) para o bloqueio.
- RN06: Quadro 32 Registrar Exame "Atualiza o exame com o resultado" (update em registro clínico); Quadro 30 altera status de prescrição; Quadro 22 estende RN06 à auditoria; Quadro 21 estende a usuário.
- RN07 obrigatórios: espécie, sexo, porte, baia, esterilizado, status, motivo de entrada, data de entrada → comparar NN do lógico (Fig. 13).
- RN08: "ao menos uma amostra" não aparece nas restrições do Quadro 40.
- RN10 coerente (1.3, Resumo, RF-B03, Quadro 42, T13); suporte: ProcessoSanitario.notificado_em; ResponsavelProcesso.email.
- RN11 nomeia só RelatorioGerado; RF-B06/Quadro 45/Quadro 91 aplicam a DocumentoProcesso (StatusDocumento).
- RN12 transições; Quadro 42 pré-condição coerente; verificar enum StatusProcesso (Fig. 24).
- RF-A05: "No destino Eutanásia, registrar o laudo do responsável técnico" — nenhum atributo de laudo em Animal (Quadro 67) nem entidade; verificar DER/lógico/classes.
- RF-A03 base do alerta: "data de validade de cada dose" (Vacinacao.data_validade) vs Quadro 29 "data de aplicação + intervalo em meses" (Vacina.intervalo_meses) — Quadro 29 não pede data de validade como entrada.
- PreferenciaUsuario.notif_email_diario (resumo diário por e-mail) sem RF correspondente.
- Resultado laboratorial RF-B03: Negativo/Positivo/Material Inadequado/Inconclusivo/Não Realizado/Aguardando → comparar enum (Fig. 24).
- Destinos RF-A05: Adotado, Resgatado, Óbito, Eutanásia, Transferido → comparar StatusAnimal (Fig. 21).
- Contagens das Considerações Finais: 20 RF (3+5+3+7+2) ✓, 10 RNF ✓, 12 RN ✓, 36 UC (Quadros 16–51) ✓.

## Tecnologias
- 2.3: Java 21, Spring Boot 3, Maven, Spring Security, JWT (RFC 7519), React 18, TypeScript, Vite, PostgreSQL 16, Spring Data JPA/Hibernate, Flyway; 2.3.4: Git/GitHub/GitHub Actions, Docker/Compose, pgAdmin, Insomnia, PlantUML, brModelo, dbdiagram.io, HTML/CSS. Quadro 14 sem versões. Recharts sem citação (RECHARTS, 2026 só nas referências).
- Intro: 95 cães e 15 gatos (equipe); Cap. 3: planilha 95 cães e 18 felinos (16 disponíveis).

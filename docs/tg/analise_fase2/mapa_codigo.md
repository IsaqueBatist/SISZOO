# Mapa do código — SISZOO (Fase 2, Etapa 0)

Data do levantamento: 22/10/2026. Modo somente leitura. Toda afirmação aponta para arquivo e linha/símbolo. Raiz do repositório: `C:\Users\isaqu\Desktop\codigo\SISZOO`.

## 1. Versões (pom.xml / package.json)

| Item | Versão no código | Fonte |
|---|---|---|
| Java | 21 | `backend/pom.xml:30` (`<java.version>21</java.version>`) |
| Spring Boot | **4.1.1** | `backend/pom.xml:8` (`spring-boot-starter-parent` 4.1.1) |
| PostgreSQL | 16 (`postgres:16-alpine`) | `docker-compose.yml:3` |
| Flyway | starter do Boot + `flyway-database-postgresql` | `backend/pom.xml:58,98` |
| Spring Security, Data JPA, Validation, WebMVC, Mail, Thymeleaf, Cache | starters do Boot 4.1.1 | `backend/pom.xml:45-82` |
| Caffeine (cache) | gerenciada pelo Boot | `backend/pom.xml:53` |
| flying-saucer-pdf-openpdf | 9.3.2 | `backend/pom.xml:93-94` |
| jjwt (api/impl/jackson) | `${jjwt.version}` | `backend/pom.xml:101-114` |
| Lombok, MapStruct | gerenciada / `${mapstruct.version}` | `backend/pom.xml:131,136` |
| Testcontainers (postgresql), Rest Assured, GreenMail | starters/test | `backend/pom.xml:166-192` |
| React | **19.2.8** | `frontend/package.json` dependencies |
| TypeScript | ~6.0.2 | idem (devDependencies) |
| Vite | ^8.2.0 | idem |
| react-router-dom | ^7.18.2 | idem |
| @tanstack/react-query | ^5.101.4 | idem |
| axios | ^1.19.0 | idem |
| zod | ^4.4.3 | idem |
| recharts | ^3.10.1 | idem |
| react-hook-form + @hookform/resolvers | ^7.87.0 / ^5.9.1 | idem (não citados no documento) |
| vitest, @testing-library/*, msw, jsdom, oxlint | ^4.1.11 / ^16.3.2 / ^2.15.0 / ^30 / ^1.75 | idem |
| idb (biblioteca) | **ausente**: IndexedDB usado pela API nativa | `frontend/src/lib/rascunhoDb.ts:33` (`indexedDB.open`) |
| Playwright | **ausente** em `package.json`/repositório | busca `playwright` sem resultado |
| CI | GitHub Actions | `.github/workflows/ci.yml` |

## 2. Estrutura de pacotes

### Backend (`backend/src/main/java/com/siszoo`, 459 arquivos .java incluindo testes)
- `usuarios/` — controller (`AuthController`, `UsuarioController`, `PreferenciaUsuarioController`, `AuditoriaController`), service (`AuthService`, `JwtService`, `AutoridadeService`, `UsuarioService`, `PreferenciaUsuarioService`, `AuditoriaEventoService`), entity (`Usuario`, `Cargo`, `UsuarioCargo`, `UsuarioCargoId`, `CargoPermissao`, `PreferenciaUsuario`, `AuditoriaEvento`, enums `Modulo`, `AcaoAuditoria`, `TemaUsuario`, `DensidadeUsuario`), `DataSeeder`.
- `animais/` — `AnimalController`, `BaiaController`, `CatalogoAnimalController`; `AnimalService`, `BaiaService`, `CatalogoAnimalService`, `FichaCompletaService`; entidades `Animal`, `Baia`, `TipoBaia`, `Especie`, `StatusAnimal`, `MotivoEntrada` (catálogos como tabelas).
- `animais/clinico/` — `VacinacaoController`, `ProcedimentoController`, `PrescricaoController`, `MedicamentoController`, `CategoriaFarmacologicaController`; services homônimos; entidades `Vacina`, `Vacinacao`, `Procedimento`, `TipoProcedimento`, `Prescricao`, `Medicamento`, `CategoriaFarmacologica`, enums `UnidadeDose`, `UnidadeFrequencia`, `ViaAdministracao`, `StatusPrescricao`.
- `alertas/` — `AlertaVacinalController`, `AlertaVacinalService`.
- `ocorrencias/` — `OcorrenciaController`, `OcorrenciaService`, `PermissoesOcorrencia`, `OcorrenciaMapper`; entidades `Ocorrencia`, `Denunciante`, `Denunciado`, `MovimentacaoOcorrencia`, `AnexoOcorrencia`, `AnexoOcorrenciaConteudo`, `TipoOcorrencia`, `ProvidenciaTomada`, enums `StatusOcorrencia`, `TipoMovimentacaoOcorrencia`.
- `processos/` — `ProcessoSanitarioController`, `ProcessoSanitarioService`, `NotificacaoResultadoService`, `NotificacaoResultadoListener`, evento `ResultadoLancadoEvent`; entidades `ProcessoSanitario`, `ResponsavelProcesso`, `AnimalAmostrado`, `ResultadoProcesso`, `Doenca`, `Laboratorio`, `Sintoma`, `ResultadoLaboratorial`, `DesfechoAnimal` (catálogos como tabelas), enums `StatusProcesso`, `StatusClinicoAmostra`, `TipoAbrigo`, `MaterialBiologico`, `NivelContato`.
- `relatorios/` — `DashboardController`, `RelatorioController`; `DashboardService`, `RelatorioGeradoService`, `FiltroRelatorioResolver`, `GeradorRelatorio` (interface) + 6 `Relatorio*Service`, `PdfRelatorioRenderer`, `RelatorioTemplateConfig`; entidade `RelatorioGerado`, enum `TipoRelatorio`.
- `comum/` — `config` (`SecurityConfig`, `AsyncConfig`, `CacheConfig`, `ClockConfig`, `EmailTemplateConfig`, `WebMvcConfig`), `security` (`JwtAuthenticationFilter`, `JwtAuthenticationEntryPoint`, `JwtAccessDeniedHandler`, `PreAutorizacaoInterceptor`), `service` (`ProtocoloService`, `EmailService`, `EmailTemplateService`), `util` (`CsvWriter`, `BlocoCsv`, `Formatadores`), `exception` (`GlobalExceptionHandler`, `CampoInvalidoException`), `controller/HealthController`, `dto` (`PaginaResponse`, `ErroResponse`, `HealthResponse`).
- Recursos: `application.yml` (perfis dev/docker/test), `db/migration/V1..V22`, `templates/email/resultado-processo.{html,txt}`, `templates/relatorios/*.html` (6 + fragmentos), `fonts/`.

### Frontend (`frontend/src`)
- `routes/` — `AppRoutes.tsx` (rotas com lazy loading), guards `RotaProtegida`, `RotaAdmin`, `RotaGestaoBaias`, `RotaLeituraOcorrencias`, `RotaEscritaOcorrencias`, `RotaEscritaAnimais`, `RotaEscritaProcessos`, `RouteErrorBoundary`.
- `features/` por funcionalidade: `auth`, `dashboard`, `graficos`, `alertas`, `animais` (+ histórico clínico), `baias`, `medicamentos`, `ocorrencias`, `processos`, `relatorios`, `usuarios`, `perfil`, `configuracoes`. Cada uma com `api/`, `hooks/`, `components/`, `schemas/` (Zod), `types/`, `storage/` (rascunhos), `utils/`.
- `lib/` — `http.ts` (axios + Bearer + evento 401), `nav.ts` (menu por perfil), `rascunhoDb.ts`/`useRascunho.ts` (IndexedDB), `datas.ts`, `theme.ts`, `queryClient.ts`, `env.ts`, `arquivos.ts`, `erroApi.ts`.
- `components/layout/` (`Layout`, `Sidebar`, `Topbar`, `Skeleton`, `ErroComRetry`, `SeloDadosMock`), `components/ThemeProvider.tsx`, `components/BannerRascunho.tsx`, `pages/EmConstrucao.tsx`, `mocks/` (MSW), `styles/`.

## 3. Modelo de dados (migrations = autoridade)

Fonte: `backend/src/main/resources/db/migration/V1__baseline.sql` … `V22__resultado_laboratorial_codigo_imutavel.sql` (22 migrations; schema reconstruído em `schema_migrations.json` por `scripts/parse_schema.py`). 39 tabelas finais; `sessao` criada em V2 e **removida em V8**.

Convenções (comentários das próprias migrations): PK uuid `gen_random_uuid()`; catálogos como tabelas-domínio com `codigo` UNIQUE (`especie`, `status_animal`, `motivo_entrada`, `tipo_baia`, `vacina`, `tipo_procedimento`, `tipo_ocorrencia`, `providencia_tomada`, `doenca`, `laboratorio`, `sintoma`, `resultado_laboratorial`, `desfecho_animal`); enums de aplicação como `varchar + CHECK` (`cargo_permissao.modulo`, `preferencia_usuario.tema/densidade`, `auditoria_evento.acao`, `animal.sexo/pelagem/porte` em minúsculas, `vacinacao.dose_unidade`, `prescricao.*`, `ocorrencia.status_ocorrencia`, `movimentacao_ocorrencia.tipo_movimentacao`, `processo_sanitario.status_processo`, `animal_amostrado.status_clinico/tipo_abrigo/material_biologico/nivel_contato`, `relatorio_gerado.tipo_relatorio`); datas de negócio `date`/`timestamp` **sem fuso, no horário de America/Sao_Paulo** (`application.yml:9-14`, `ClockConfig`, `Dockerfile:14 ENV TZ`), exceto `relatorio_gerado.gerado_em timestamptz`.

### 3.1 Módulo 1 (V2, V3, V8, V9, V12)
- `usuario`: id, email UQ NN, senha NN, nome NN, sobrenome NN, crmv, telefone, ativo NN, **dois_fatores_ativo NN default false**, ultimo_acesso, criado_em NN, senha_alterada_em, desativado_em, data_modificacao NN.
- `cargo` (id, nome NN, descricao); `usuario_cargo` (usuario_id+cargo_id PK, adicionado_em NN); `cargo_permissao` (id, cargo_id FK NN, modulo varchar(30) CHECK 5 valores, feature varchar(100) NN, leitura/escrita/exclusao NN; UQ(cargo_id, modulo, feature)).
- `preferencia_usuario`: id, usuario_id UQ NN, tema CHECK(LIGHT,DARK), densidade CHECK(COMPACTO,NORMAL,CONFORTAVEL), notif_alertas_criticos, notif_vacina_vencendo, notif_superlotacao, notif_resultado_lab, notif_email_diario (todos NN).
- `auditoria_evento`: id, usuario_id FK (nulo permitido, ON DELETE SET NULL), acao CHECK(CRIACAO, ATUALIZACAO, DESATIVACAO, REATIVACAO, LOGIN, LOGOUT, EXPORTACAO, ENCERRAMENTO, VISUALIZACAO [V12]), entidade NN, **entidade_id uuid [V9]**, payload_antes/depois jsonb, ip, ocorreu_em NN.
- Seed V3: cargos `Administrador`, `Veterinário`, `Agente Sanitário` (UUIDs fixos) e matriz `cargo_permissao` (feature `geral`): Admin tudo (RELATORIOS só leitura); Veterinário GESTAO_ANIMAIS L/E, PROCESSOS_SANITARIOS L/E, RELATORIOS L, OCORRENCIAS L (zerada na **V11**); Agente GESTAO_ANIMAIS L, OCORRENCIAS L/E, PROCESSOS L/E, RELATORIOS L. V10 acrescenta feature `denunciante_sigiloso` (leitura) para Administrador **e Agente Sanitário**.

### 3.2 Módulo 2 (V4, V5, V6, V7, V16, V17, V18)
- `baia`: id, nome varchar(40) NN, tipo_baia_id FK NN, capacidade smallint NN, finalidade varchar(80), ativa NN, observacoes. **Sem `animais_alojados`** (comentário V4:62 "atual_ocupacao NÃO é coluna").
- `animal`: id, nome varchar(80) NN, especie_id FK NN, sexo CHECK(macho,femea,nao_identificado) NN, raca, coloracao, pelagem CHECK(curta,longa), porte CHECK(pequeno,medio,grande), peso_kg decimal(5,2), idade_aprox varchar(30), data_nascimento_aprox date, microchip varchar(30) (índice único parcial `WHERE microchip IS NOT NULL` [V16]), esterilizado NN, data_esterilizacao, status_id FK NN, motivo_entrada_id FK NN, data_entrada timestamp NN, baia_id FK (nulo = em trânsito), ficha_completa NN, foto_url text, observacoes, criado_por_id FK NN, criado_em, atualizado_em. **Sem** numero_medalha, data_implantacao_chip, procedencia, data_saida.
- Catálogos seed V4: `especie` (canino, felino, quiroptero, pnh); `status_animal` (disponivel_adocao, em_tratamento, em_quarentena, adotado, obito_natural, obito_eutanasia, transferido); `motivo_entrada` (recolhimento, abandono, entrega_voluntaria, resgate, apreensao_judicial); `tipo_baia` (interna, gatil, externa). Não há seed de baias.
- `vacina` (codigo UQ, nome, intervalo_meses nulo permitido, ativo; seed 8 vacinas com 12 meses); `tipo_procedimento` (codigo, nome, ativo; seed atendimento_clinico, castracao, cirurgia_maior, vacinacao); `categoria_farmacologica` (nome UQ, ativo); `medicamento` (nome, categoria_id FK NN, ativo).
- `vacinacao`: id, animal_id FK NN, vacina_id FK NN, aplicado_por_id FK (RESTRICT [V7]), data_aplicacao NN, numero_dose, dose_quantidade decimal(8,3) NN, dose_unidade CHECK + CHECK NOT VALID obrigatório [V7], lote, observacoes, **retifica_id** FK auto UQ, criado_em. **Sem data_validade** (calculada: `VacinacaoMapper.calcularDataValidade`).
- `procedimento`: id, animal_id, tipo_procedimento_id, executado_por_id, data NN, descricao, resultado, retifica_id UQ, criado_em.
- `prescricao`: id, animal_id, prescrito_por_id, medicamento_id, data_inicio NN, data_fim_prevista, data_fim_real, frequencia_aplicada NN, unidade_frequencia CHECK, dose_quantidade NN, dose_unidade CHECK NN, via_administracao CHECK, status CHECK(ATIVA,CONCLUIDA,SUSPENSA,CANCELADA), retifica_id UQ, criado_em.
- Triggers V17: `vacinacao`, `procedimento`, `prescricao`, `processo_sanitario` recusam DELETE e TRUNCATE (`fn_registro_critico_sem_exclusao`).
- **Não existem**: `adocao`, `exame`, `tipo_exame`, `anexo_animal`, `anexo_vacinacao`, `anexo_procedimento`, `anexo_exame`, `vacina_especie`, `animal_sintoma`.

### 3.3 Módulo 3 (V10, V11, V12)
- `protocolo_sequencia` (entidade CHECK(OCORRENCIA, PROCESSO, RELATORIO [V20]), ano, ultimo; PK(entidade, ano)).
- `ocorrencia`: id, protocolo varchar(20) UQ NN, tipo_ocorrencia_id FK NN, status_ocorrencia CHECK(ABERTA, EM_ATENDIMENTO, ENCERRADA) NN, data_abertura NN, hora_abertura, **endereco varchar(255) NN**, bairro varchar(80) NN, ponto_referencia, descricao NN, urgente NN, sigilosa NN, **anonima NN**, **latitude/longitude decimal(9,6)**, registrado_por_id FK NN, providencia_tomada_id FK, descricao_encerramento, encerrada_em, **encerrada_por_id FK**, criado_em, atualizado_em; CHECKs de coerência do encerramento e `NOT (anonima AND sigilosa)`.
- `denunciante` (id, **ocorrencia_id FK UQ NN**, nome, cpf, telefone, email, cep, endereco, bairro_residencial — todos opcionais); `denunciado` (id, ocorrencia_id FK UQ NN, nome, cpf, telefone, endereco, observacoes). A FK fica no filho (1:0..1), não em `ocorrencia`.
- `movimentacao_ocorrencia`: id, ocorrencia_id NN, usuario_id NN, tipo_movimentacao CHECK(REGISTRADA, EQUIPE_DESPACHADA, PROCESSO_VINCULADO, AGUARDANDO_RESULTADO, ENCERRADA, NOTA_INTERNA), status_anterior, status_novo, data NN, descricao, criado_em; CHECK amarra tipo↔transição.
- `anexo_ocorrencia` (id, ocorrencia_id, nome, mime_type CHECK(image/jpeg, image/png, application/pdf), tamanho ≤ 5 MB, criado_por_id, criado_em) + `anexo_ocorrencia_conteudo` (anexo_id PK, conteudo **bytea**). Conteúdo no banco, não em URL.
- Seeds: `tipo_ocorrencia` (zoonose, morcegos, irregular, agressivo, outros); `providencia_tomada` (orientacao_municipe, encaminhamento_gepar, abertura_processo, captura_remocao, sem_acao, outro, registro_indevido).

### 3.4 Módulo 4 (V10 mínimo, V13, V14, V15, V19, V21, V22)
- `processo_sanitario`: id, protocolo varchar(20) UQ NN, data_abertura NN, **ocorrencia_id FK UQ** (0..1, trigger de vínculo imutável), urgente NN, status_processo CHECK(ABERTO, AGUARDANDO_RESULTADO, COM_RESULTADO, CONCLUIDO), criado_por_id NN, doenca_id FK NN, laboratorio_id FK NN, **cid** (snapshot), gal_numero varchar(40), sinan_numero varchar(40), data_envio_amostras timestamp, previsao_retorno, resultado_laboratorial_id FK, data_resultado, desfecho_animal_id FK, observacoes, **data_notificacao_municipe** [V21], criado_em, atualizado_em. Constraint triggers adiáveis: 1 responsável e ≥ 1 amostra por processo (V13).
- `responsavel_processo`: id, **processo_id FK UQ NN** (1:1 no filho), nome NN (CHECK não vazio), cpf (sem UNIQUE), telefone, email, cep, endereco, bairro_residencial, bairro_ocorrencia.
- `animal_amostrado`: id, processo_id NN, animal_id FK, especie_id FK NN, sexo CHECK NN, raca, coloracao, pelagem, idade_aprox, peso_kg, **status_clinico CHECK(SINTOMATICO, ASSINTOMATICO, OBITO) NN**, tipo_abrigo CHECK NN, **alteracao_comportamental text**, data_coleta NN, material_biologico CHECK(TECIDO_ENCEFALICO, SORO, SANGUE, SALIVA, URINA) NN, contato_humano NN, nivel_contato CHECK(DIRETA, INDIRETA), agrediu_humano, observacoes, criado_em; CHECK nível/agressão ⇔ contato. **Sem** tipo_amostra, numero_campo, nome_animal.
- `amostra_sintoma` (animal_amostrado_id, sintoma_id).
- `resultado_processo` [V14/V15/V21]: histórico imutável de resultados (id, processo_id, resultado_laboratorial_id, data_resultado, observacoes, retifica_id, registrado_por_id, registrado_em); triggers recusam UPDATE/DELETE/TRUNCATE; positivo não pode ser corrigido (V21).
- Catálogos seed V13: `doenca` (raiva A82, esporotricose B42, leishmaniose_visceral B55.0, leptospirose A27, febre_maculosa A77, febre_amarela A95); `laboratorio` (pasteur_sp, ial_sorocaba, ccz_sp, itu_ll01); `sintoma` (12); `resultado_laboratorial` (aguardando, positivo, negativo, inconclusivo, material_inadequado, nao_realizado; código imutável [V22]); `desfecho_animal` (em_acompanhamento, obito_natural, obito_eutanasia, obito_outro).
- **Não existem**: `documento_processo`, `tipo_documento_processo`.

### 3.5 Módulo 5 (V20)
- `relatorio_gerado`: id, **doc_id varchar(30) UQ** ("DOC-AAAA-NNNN"), tipo_relatorio CHECK (6 valores), periodo_inicio NN, periodo_fim NN, parametros_jsonb, gerado_por_id FK NN, gerado_em timestamptz NN, arquivo_url text (nunca preenchido pelo serviço), tamanho_bytes integer. **Sem** status nem url_expira_em.

### 3.6 Entidades JPA × migrations
Entidades usam `ddl-auto: validate` (`application.yml:77,101,121`), logo coincidem com o schema. Diferenças de representação: enums Java (`@Enumerated(STRING)`) sobre colunas varchar+CHECK; catálogos como entidades (`Especie`, `StatusAnimal`, …) referenciados por `codigo`; `Animal.dataEntrada` é `LocalDateTime` (coluna timestamp); `RelatorioGerado.geradoEm` é `OffsetDateTime`. Nenhuma divergência entidade↔migration encontrada que o `validate` deixaria passar (tipos/nullable coerentes nos arquivos lidos: `Animal.java`, `Ocorrencia.java`, `ProcessoSanitario.java`, `AnimalAmostrado.java`, `Usuario.java`, `RelatorioGerado.java`, `Vacinacao.java`, `Prescricao.java`, `Procedimento.java`, `AuditoriaEvento.java`, `PreferenciaUsuario.java`, `CargoPermissao.java`, `Baia.java`, `Denunciante.java`, `MovimentacaoOcorrencia.java`, `ResultadoProcesso.java`, `ResponsavelProcesso.java`).

## 4. Enums (Java)
`Modulo` {USUARIOS_ACESSO, GESTAO_ANIMAIS, OCORRENCIAS_DENUNCIAS, PROCESSOS_SANITARIOS, RELATORIOS}; `AcaoAuditoria` {CRIACAO, ATUALIZACAO, DESATIVACAO, REATIVACAO, LOGIN, LOGOUT, EXPORTACAO, ENCERRAMENTO, VISUALIZACAO}; `TemaUsuario` {LIGHT, DARK}; `DensidadeUsuario` {COMPACTO, NORMAL, CONFORTAVEL}; `UnidadeDose` {MILIGRAMA, MICROGRAMA, GRAMA, MILILITRO, UNIDADE_INTERNACIONAL}; `UnidadeFrequencia` {HORAS, DIAS}; `ViaAdministracao` {ORAL, INTRAVENOSA, INTRAMUSCULAR, SUBCUTANEA, TOPICA}; `StatusPrescricao` {ATIVA, CONCLUIDA, SUSPENSA, CANCELADA}; `StatusOcorrencia` {ABERTA, EM_ATENDIMENTO, ENCERRADA}; `TipoMovimentacaoOcorrencia` {REGISTRADA, EQUIPE_DESPACHADA, PROCESSO_VINCULADO, AGUARDANDO_RESULTADO, ENCERRADA, NOTA_INTERNA}; `StatusProcesso` {ABERTO, AGUARDANDO_RESULTADO, COM_RESULTADO, CONCLUIDO} (avanço de um passo, `StatusProcesso.java`); `StatusClinicoAmostra` {SINTOMATICO, ASSINTOMATICO, OBITO}; `TipoAbrigo` {INTRADOMICILIAR, PERIDOMICILIAR, SILVESTRE, NAO_IDENTIFICADO}; `MaterialBiologico` {TECIDO_ENCEFALICO, SORO, SANGUE, SALIVA, URINA}; `NivelContato` {DIRETA, INDIRETA}; `TipoRelatorio` {ANUAL_PROCESSOS, VACINACAO, ADOCOES, PROCEDIMENTOS, OCUPACAO_BAIAS, OCORRENCIAS_BAIRRO} (código lowercase na API); `ProtocoloService.Entidade` {OCORRENCIA, PROCESSO, RELATORIO}; `SeveridadeAlerta` {VENCIDA, A_VENCER}. Sem enum Java para Especie, StatusAnimal, Sexo, Porte, ResultadoLaboratorial, DesfechoAnimal, TipoAmostra, StatusDocumento, StatusRelatorio, TipoAcesso (autoridades são strings `MODULO:acao`).

## 5. Endpoints REST (`@RequestMapping` + `@PreAuthorize`)

| Método e rota | Autorização | Controller:linha |
|---|---|---|
| GET /api/health | público | `comum/controller/HealthController.java:22` |
| POST /api/auth/login | público | `usuarios/controller/AuthController.java:29` |
| POST /api/auth/senha | autenticado | `AuthController.java:34` |
| GET /api/usuarios · POST /api/usuarios · PATCH /api/usuarios/{id}/status | USUARIOS_ACESSO:leitura / escrita / escrita | `UsuarioController.java:35,46,52` |
| GET /api/usuarios/me · PATCH /api/usuarios/me | autenticado | `UsuarioController.java:59,64` |
| GET/PATCH /api/usuarios/me/preferencias | autenticado | `PreferenciaUsuarioController.java:28,33` |
| GET /api/auditoria (paginado, sem filtros) | USUARIOS_ACESSO:leitura | `AuditoriaController.java:23` |
| GET /api/animais · GET /{id} · POST · PUT /{id} | GESTAO_ANIMAIS:leitura/leitura/escrita/escrita | `AnimalController.java:34,46,52,58` |
| GET /api/animais/catalogos | GESTAO_ANIMAIS:leitura | `CatalogoAnimalController.java:21` |
| GET /api/baias · GET /{id} · POST · PUT /{id} · PATCH /{id}/status · DELETE /{id} (soft) | leitura/leitura/escrita/escrita/escrita/**exclusao** | `BaiaController.java:36-75` |
| GET/POST /api/vacinacoes · GET /{id} (sem PUT/DELETE) | leitura/escrita | `VacinacaoController.java:36-52` |
| GET/POST /api/procedimentos · GET /{id} | leitura/escrita | `ProcedimentoController.java:33-49` |
| GET/POST /api/prescricoes · GET /{id} | leitura/escrita | `PrescricaoController.java:33-49` |
| GET/POST /api/medicamentos · GET/PUT /{id} · DELETE /{id} (soft) | leitura/escrita/escrita/exclusao | `MedicamentoController.java:34-69` |
| GET/POST /api/categorias-farmacologicas | leitura/escrita | `CategoriaFarmacologicaController.java:30,36` |
| GET /api/alertas/vacinas | GESTAO_ANIMAIS:leitura | `AlertaVacinalController.java:23` |
| GET /api/ocorrencias · /catalogos · /{id} | OCORRENCIAS_DENUNCIAS:leitura | `OcorrenciaController.java:53,65,71` |
| POST /api/ocorrencias · PUT /{id} · PATCH /{id}/status · POST /{id}/encerramento · POST /{id}/processo · POST /{id}/notas · POST /{id}/anexos | OCORRENCIAS_DENUNCIAS:escrita | `OcorrenciaController.java:77-119` |
| GET /api/ocorrencias/{id}/anexos/{anexoId} | leitura (+ feature sigilo no service) | `OcorrenciaController.java:125` |
| POST /api/processos · GET · /catalogos · /{id} · PATCH /{id}/status · POST /{id}/resultados · POST /{id}/notificacoes/reenviar | PROCESSOS_SANITARIOS:escrita/leitura/leitura/leitura/escrita/escrita/escrita | `ProcessoSanitarioController.java:50-97` |
| GET /api/dashboard/kpis · /graficos | RELATORIOS:leitura | `DashboardController.java:25,31` |
| GET /api/relatorios/tipos · /preview · POST /exportar · GET /historico | RELATORIOS:leitura | `RelatorioController.java:47-86` |

Não existem endpoints de: logout, exames, anexos de animal, adoção, documento PDF do processo, edição de usuário, cargos/permissões, exclusão de ocorrência/processo/registros clínicos.

## 6. Segurança
- `SecurityConfig.java:35-48`: CSRF desligado, CORS por origem configurada, `SessionCreationPolicy.STATELESS`, `/api/auth/login` e `/api/health` públicos, demais autenticados; `BCryptPasswordEncoder` (`:66`); `@EnableMethodSecurity`.
- `JwtAuthenticationFilter.java:68-92`: valida o Bearer (`JwtService.validarToken`), confere `existsByIdAndAtivoTrue` a cada requisição, resolve autoridades do banco (`AutoridadeService.resolverAutoridades`) a partir do claim `cargos`.
- `JwtService`: HMAC com `siszoo.jwt.secret` (≥ 32 bytes), claim `cargos`, expiração `siszoo.jwt.expiracao-minutos` = 60 (`application.yml:88,112,151`).
- `AutoridadeService.java:26-55`: autoridade `MODULO:leitura|escrita|exclusao` para feature `geral`; `MODULO:feature:acao` para outras (ex.: `OCORRENCIAS_DENUNCIAS:denunciante_sigiloso:leitura`).
- `PreAutorizacaoInterceptor`: avalia o `@PreAuthorize` antes da validação do corpo (autorização antes de 422).
- Regras de negócio por permissão: `PermissoesOcorrencia.java:13-26`; mascaramento do denunciante no backend `OcorrenciaMapper.java:28-55,98-104`.
- E-mail institucional `^[a-z.]+@itu\.sp\.gov\.br$`: `CriarUsuarioRequest`, `LoginRequest`, `DataSeeder`, `loginSchema.ts`.
- Primeiro acesso: `RotaProtegida.tsx` redireciona para `/trocar-senha` quando `senhaAlteradaEm === null`; backend `POST /api/auth/senha` grava `senha_alterada_em` (`AuthService.java:69`). Não há endpoint de logout; logout é só no cliente (`AuthContext.tsx:72-74`, `Sidebar.tsx:74-77`).
- Frontend: token em `sessionStorage` (`AuthContext.tsx:11,44`), interceptor 401 → evento `auth:unauthorized` (`http.ts:25-36`), guards de rota por `roleKey` (`nav.ts:94-102`).

## 7. Jobs agendados, assíncrono, e-mail, auditoria
- `@Scheduled`: **nenhum** (`AlertaVacinalService.java:24-26` registra que não há `@EnableScheduling`). O alerta vacinal é calculado sob demanda (`GET /api/alertas/vacinas`, janela `DIAS_ANTECEDENCIA = 7`, `AlertaVacinalService.java:30,46-70`).
- `@Async` (`AsyncConfig`, `application.yml:42-49`): `EmailService.enviar` (`EmailService.java:71,81`) e `NotificacaoResultadoListener` (`@TransactionalEventListener(AFTER_COMMIT)` + `@Async`, `:28-29`).
- E-mail: `EmailService` (JavaMailSender, remetente `siszoo.notificacoes.remetente` = `nao-responda@itu.sp.gov.br`, falha só logada); templates Thymeleaf `templates/email/resultado-processo.html|txt`; `NotificacaoResultadoService.java:77-166`: envia ao responsável **só para resultado `positivo`**, registra `data_notificacao_municipe` após aceite do SMTP, reenvio manual; Vigilância Epidemiológica **mockada em log** (`:161-166`).
- Auditoria: `AuditoriaEventoService.registrar(usuario, acao, entidade, entidadeId, antes, depois)` (`:38-49`); chamada em login (`AuthService.java:53`), troca de senha, criação/status/perfil de usuário, ocorrência (criação/atualização/status/encerramento/vínculo/anexo/VISUALIZACAO de denunciante sigiloso e de anexo sigiloso: `OcorrenciaService.java:214,323,346,384,456,493,514,531`), processo (criação/status/resultado/notificação: `ProcessoSanitarioService.java:248,428,484,543`), vacinação/procedimento/prescrição (`VacinacaoService.java:115-118`). **Não há** auditoria em `AnimalService`, `BaiaService`, `MedicamentoService`, `PreferenciaUsuarioService`; campo `ip` nunca preenchido (busca `setIp|getRemoteAddr` sem resultado).
- Cache: Caffeine 5 min para `dashboardKpis` e `dashboardGraficos` (`application.yml:55-58`, `DashboardService.java:103,117`).
- Protocolo: `ProtocoloService.java:41-56` — `INSERT ... ON CONFLICT (entidade, ano) DO UPDATE ... RETURNING` na transação de quem cria (`Propagation.MANDATORY`), formato `"%03d/%d"` (3 dígitos mínimos, cresce acima de 999), ano do `Clock`.

## 8. Rotas e páginas do frontend (`AppRoutes.tsx:91-140`)

| Rota | Componente | Guard |
|---|---|---|
| `/` → `/login` | redirecionamento | — |
| `/login` | `auth/components/Login` | — |
| `/trocar-senha` | `auth/components/TrocarSenha` | `RotaProtegida` |
| `/dashboard` | `dashboard/components/Dashboard` (KPIs, alertas, gráficos lazy) | protegida |
| `/alertas/vacinas` | `alertas/components/AlertaVacinasDetalhe` | protegida |
| `/animais`, `/animais/:id` | `Animais`, `FichaAnimal` (abas Histórico, Vacinas, Procedimentos/Cirurgias, Medicamentos, Exames=placeholder) | protegida |
| `/animais/novo`, `/animais/:id/editar` | `CadastrarAnimal`, `EditarAnimal` (`AnimalForm`) | `RotaEscritaAnimais` (admin, vet) |
| `/medicamentos` | `medicamentos/components/Medicamentos` | protegida |
| `/baias` | `baias/components/GestaoBaias` | `RotaGestaoBaias` (admin, vet) |
| `/ocorrencias`, `/ocorrencias/:id` | `Ocorrencias`, `OcorrenciaDetalhe` | `RotaLeituraOcorrencias` (admin, agente) |
| `/ocorrencias/novo`, `/ocorrencias/:id/editar` | `CadastrarOcorrencia`, `EditarOcorrencia` | `RotaEscritaOcorrencias` |
| `/processos`, `/processos/:id` | `Processos`, `ProcessoDetalhe` | protegida |
| `/processos/novo` | `CadastrarProcesso` (wizard `ProcessoForm`) | `RotaEscritaProcessos` (3 perfis) |
| `/relatorios` | `Relatorios` (6 cards + preview + histórico) | protegida |
| `/perfil` | `perfil/components/Perfil` | protegida |
| `/configuracoes` | `configuracoes/components/Configuracoes` | protegida |
| `/usuarios` | `usuarios/components/Usuarios` | `RotaAdmin` |
| `*` | `pages/EmConstrucao` | protegida |

Menu por perfil (`nav.ts:17-38`): admin: dashboard, animais, ocorrências, processos, relatórios, medicamentos, baias, usuários, config; vet: sem ocorrências e sem usuários; agente: sem baias e sem usuários. Rascunho local (IndexedDB `siszoo-rascunhos`, stores animais/ocorrencias/processos/clinico, escopo por usuário): `rascunhoDb.ts`, `useRascunho.ts`; anexos pendentes de ocorrência reenviáveis (`useAnexosPendentes`).

## 9. Build e testes (executados em 22/10/2026)
- Backend `./mvnw -q -DskipTests compile`: **OK** (`log_backend_compile.txt`, `COMPILE_EXIT=0`). Docker disponível.
- Backend `./mvnw verify` (surefire + failsafe com Testcontainers): **BUILD SUCCESS**, `VERIFY_EXIT=0` (`log_backend_verify.txt`). Surefire (unitários): 230 testes, 0 falhas, 0 erros. Failsafe (integração, PostgreSQL via Testcontainers + GreenMail): 445 testes, 0 falhas, 0 erros. Total: 675 testes executados sem falha.
- Frontend `npm run build` (`tsc -b && vite build`): **OK** em 6,0 s (`log_frontend_build.txt`, `EXIT=0`).
- Frontend `npm test` (vitest): **83 arquivos, 498 testes: 492 passaram, 6 falharam** (`log_frontend_test.txt`, `EXIT=1`). As 6 falhas estão em `dashboard/hooks/useDashboardKpis.test.tsx`, `dashboard/components/Dashboard.test.tsx` (3), `graficos/hooks/useGraficos.test.tsx` e `graficos/components/GraficosDashboard.test.tsx`: os testes esperam o modo mock dos KPIs/gráficos como padrão, mas `frontend/.env` define `VITE_USE_MOCK_KPIS=false` e `VITE_USE_MOCK_GRAFICOS=false`, e o MSW recusa as chamadas reais a `/api/dashboard/kpis` e `/graficos` (log: "intercepted a request without a matching request handler"). Falha de ambiente/configuração de teste, não de regra de negócio.
- Contagem: 491 métodos `@Test` no backend (`grep -rc "@Test"`), 433 `it(`/`test(` no frontend.

## 10. Itens ignorados nesta varredura (sem relevância para o documento)
DTOs de resposta internos, mappers MapStruct, projeções de repositório, `GlobalExceptionHandler` (mapeamento de status HTTP), `WebMvcConfig`, `EmailTemplateConfig`, `Formatadores`, `BlocoCsv`, `CsvWriter`, fixtures MSW, scripts de seed de teste (`scripts/seed-test-data.mjs`), Dockerfiles, `nginx.conf` (escuta em 80, sem TLS), `.oxlintrc.json`, configuração do Vite/TS. Mencionados aqui apenas para registro.

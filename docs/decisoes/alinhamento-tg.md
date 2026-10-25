# Decisões — alinhamento código × TG (22 a 24/10/2026)

Uma linha por decisão, no formato dos demais arquivos desta pasta. Origem: análise do documento do TG em quatro fases
(`docs/tg/analise_fase1` a `analise_fase3`, `relatorio_fase4.md`). Os IDs `F1-xxx` são achados da Fase 1 (documento ×
documento) e `F2-xxx` são linhas da matriz de rastreabilidade da Fase 2 (`docs/tg/analise_fase2/matriz_rastreabilidade.csv`,
colunas `decisao_autor`/`observacao_autor`). As decisões foram tomadas pelos autores (Isaque, com anuência registrada para
cada item) e implementadas na branch `alinhamento-tg` (PR #108), com correções nos PRs #109 e #110. Código de referência:
migrations V23–V26, pacotes `animais.clinico`, `processos`, `usuarios`.

## Decisões de produto (código)

- **AT-1 (F2-014, RN10)** O e-mail automático ao munícipe sai para resultado **`positivo` ou `inconclusivo`**
  (`ResultadosNotificaveis.CODIGOS`). Reverte a revisão de 17/10/2026 (`T34.md` T34-4), que restringira a `positivo`:
  o documento, o levantamento com o CCZ e a issue #37 sempre previram os dois. Positivo continua definitivo (T35-15). Quando o
  resultado vigente muda de um notificável para outro (ex.: `inconclusivo` → `positivo`), o processo volta a notificar
  (`ProcessoSanitario.reiniciarNotificacaoMunicipe`). O reenvio manual (`POST /api/processos/{id}/notificacoes/reenviar`,
  T35-21) vale para qualquer resultado notificável ainda não confirmado pelo SMTP. Os templates
  `email/resultado-processo.{html,txt}` usam a variável `resultado`. Testes: `NotificacaoResultadoControllerIT`
  (inconclusivo notifica; demais não; correção para positivo notifica de novo; reenvio de inconclusivo).
- **AT-2 (F2-014, RN10 — Vigilância Epidemiológica)** O e-mail à Vigilância **não** é implementado (não há endereço
  institucional definido); permanece o log `[MOCK]` em `NotificacaoResultadoService.notificarVigilanciaEpidemiologica`.
  No TG aparece como pendência (RN10, UC "Registrar Resultado Laboratorial", Considerações Finais).
- **AT-3 (F2-059, RN03)** O **Agente Sanitário mantém** a permissão `OCORRENCIAS_DENUNCIAS:denunciante_sigiloso:leitura`
  (V10): ele precisa do denunciante para atender a ocorrência. O documento deixou de dizer "nenhum perfil exceto
  Administrador" e passou a descrever o mecanismo real (mascaramento no servidor para quem não tem a permissão; evento
  `VISUALIZACAO` em cada entrega; `ACESSO_NEGADO` em cada recusa, T43). Garantido por `AuditoriaSigiloIT`.
- **AT-4 (F2-065, RN09)** A **matriz de permissões do código** prevalece sobre a do documento: Veterinário escreve em
  Processos Sanitários (abre processo, lança resultado) e Agente Sanitário lê Gestão de Animais (vincular amostra a animal
  do canil, ver alertas). RN09, Quadro 4 e Quadro 15 do TG reescritos. Nenhuma migration.
- **AT-5 (F2-029, F2-078, RNF10)** Cadastro e edição de **animal** e criação/edição/desativação/reativação de **baia**
  geram evento de auditoria (`CRIACAO`, `ATUALIZACAO`, `DESATIVACAO`/`REATIVACAO`) com snapshot antes/depois
  (`AnimalService`, `BaiaService`; `AuditoriaAnimaisBaiasIT`). O microchip, uma vez definido, não pode ser alterado nem
  removido (regra já existente, agora documentada no UC "Editar Dados do Animal").
- **AT-6 (F2-004, RF-A01/RN01)** `animal` ganhou `numero_medalha` (varchar(30), índice único parcial),
  `data_implantacao_chip` (date; `CHECK` exige microchip; não futura pelo `Clock`) e `procedencia` (varchar(200)) — **V23**.
  Todos opcionais; sem backfill. Formulário (etapa 1) e ficha exibem os três. Testes: `AnimalIdentificacaoLaudoIT`.
- **AT-7 (F2-008, RF-A05 — só o laudo)** `animal.laudo_eutanasia` (text, **V24**) é obrigatório **somente na transição**
  para o status `obito_eutanasia` (criação já em eutanásia ou edição que muda para eutanásia), validado no `AnimalService`,
  sem `CHECK` no banco: registros anteriores continuam válidos e editáveis. O restante do RF-A05 (tabela `adocao`,
  adotante, devolução, `data_saida`) **não** foi implementado: a saída é a mudança de status, e o documento descreve
  `data_saida` como limitação e a adoção como "modelado; implementação prevista em trabalhos futuros".
- **AT-8 (F2-007, RF-A04 — exames e anexos, escopo mínimo)** **V25** cria `tipo_exame` (catálogo: `codigo`, `nome`,
  `ativo`; seed com hemograma, bioquímico, parasitológico, raspado de pele, citologia, sorologia, urinálise, radiografia,
  ultrassonografia) e `exame` (`animal_id`, `tipo_exame_id`, `laboratorio_id` opcional, `solicitado_por_id`,
  `data_solicitacao`, `data_resultado`, `resultado`, `observacoes`, `retifica_id` único, `criado_em`; triggers de
  não-exclusão da V17). Regras: `resultado` e `data_resultado` vêm juntos ou nenhum; datas não futuras;
  `data_resultado >= data_solicitacao` (CHECK); correção = novo `POST /api/exames` com `retificaId` (padrão de
  `ProcedimentoService`). **V26** cria `anexo_animal` (`nome`, `mime_type`, `tamanho`, `descricao`, `criado_por_id`) +
  `anexo_animal_conteudo` (bytea), no padrão de `anexo_ocorrencia`: JPG/PNG/PDF detectados pelos bytes, 5 MB,
  **10 por animal**, upload e download auditados (`anexo_animal`). Endpoints: `GET/POST /api/exames`,
  `GET/POST /api/animais/{id}/anexos`, `GET /api/animais/{id}/anexos/{anexoId}`; catálogos em
  `GET /api/animais/catalogos` (`tiposExame`, `laboratorios`). Front: aba Exames e cartão Anexos na ficha
  (`AbaExames.tsx`, `ModalRegistrarExame.tsx`, `AnexosAnimal.tsx`; rascunho `exame` em `rascunhoClinicoStorage`).
  **Fora do escopo** (modelo-alvo no DER/DBML, trabalho futuro): `anexo_vacinacao`, `anexo_procedimento`, `anexo_exame`.
- **AT-9 (F2-027, RF-C04 novo)** `GET /api/auditoria` aceita `acao`, `entidade`, `usuarioEmail`, `modulo`, `de`, `ate`
  (Specification), e `GET /api/auditoria/filtros` devolve as opções distintas; o mapa módulo → entidades fica em
  `AuditoriaEventoService.ENTIDADES_POR_MODULO`. A tela de Logs (`/logs`, só Administrador; vinda da branch
  `fix/ui-pos-revisao`) passou a filtrar no servidor. O TG ganhou o RF-C04 "Trilha de Auditoria" e a tela T26.
  Lição do CI (#108/#109): asserções de integração não podem depender da ordem dos testes (eventos de outras suítes
  ficam na trilha) — `AuditoriaFiltrosIT.filtraPorModulo` aceita qualquer entidade do módulo.
- **AT-10 (F2-012, F2-045, F2-087)** `gal_numero` e `sinan_numero` (até 40 caracteres, normalizados) entram em
  `CriarProcessoRequest`/`ProcessoSanitarioResponse` e na etapa 1 do wizard ("Nº GAL", "Nº SINAN", opcionais, registro
  manual, sem integração). `ProcessoGalSinanIT`.
- **AT-11 (F2-010, RF-E02)** `GET /api/ocorrencias` aceita `de` e `ate` (ISO, dias inclusivos sobre `data_abertura`),
  combináveis com `tipo`, `status` e `q`; dois `<input type="date">` na tela de Ocorrências. `OcorrenciaFiltroDataIT`.
  Contrato `docs/contratos/ocorrencias-filtro-data.md` atendido.
- **AT-12 (capturas)** Dois defeitos de interface achados na inspeção das capturas foram corrigidos: a grade de
  relatórios transbordava a 1366 px e o período padrão dos relatórios virava o dia em UTC (`hojeEmItu`) — commit
  `712f7f1`; a grade de KPIs das pré-visualizações ficava empilhada ao abrir `/relatorios` diretamente porque a regra
  `.kpi-grid` vivia em `Dashboard.css` — PR #110 (regra global em `styles/components.css`).
- **AT-13 (trabalhos futuros, decisão dos autores)** Não implementar: **adoção** (tabela `adocao`, adotante, devolução,
  relatório de adoções com permanência), **documento PDF do processo** (RF-B06, `documento_processo`,
  `tipo_documento_processo`, `StatusDocumento`), **Playwright/testes E2E**. Ficam na modelagem do TG com a indicação
  "modelado; implementação prevista em trabalhos futuros"; código parcial existente (status `adotado`, relatório de adoções
  como snapshot por status, cartão "Adoções no mês" ilustrativo) é mantido e descrito como tal.
- **AT-14 (F2-154)** Playwright **não** entra nas dependências do projeto. As capturas do TG são feitas com Playwright
  via `npx` em pasta temporária fora do repositório.
- **AT-15 (F2-158, datas)** O texto do TG passou a dizer o que o código faz: datas de negócio como `date`/`timestamp`
  **sem fuso**, já no horário de Itu; nada de "armazenado em UTC e convertido".

## Decisões sobre o documento (TG)

- **AT-16** Texto sempre fiel ao código em `main`; quadros de requisitos (6–10), RNFs (12), RNs (13), telas (15),
  casos de uso (Apêndice A) e dicionário (Apêndice B) reescritos a partir das migrations e dos serviços; entidades não
  implementadas receberam a nota "modelada, mas não implementada nesta versão". Nenhuma referência bibliográfica inventada.
- **AT-17** Protocolo descrito como `NNN/AAAA`, sequencial por ano **e por entidade** (`protocolo_sequencia`:
  `OCORRENCIA`, `PROCESSO`, `RELATORIO`), acima de 999 o número cresce; substituiu `0000/AAAA` em todo o documento.
- **AT-18** Introdução e Considerações Finais permanecem **sem numeração** e os capítulos 1–5 mantêm os números
  (decisão de 23/10/2026; renumerar quebraria as referências cruzadas na véspera da entrega).
- **AT-19 (ABNT)** Numeração de páginas contada desde a capa e exibida só a partir da Introdução, no canto superior
  direito (seção pré-textual sem cabeçalho/rodapé + cabeçalho com campo `PAGE`); legendas com `SEQ Figura`/`SEQ Quadro`
  e estilo *Caption*; Lista de Figuras, Lista de Quadros e Sumário como campos `TOC`; ordem listas → abreviaturas →
  sumário; dedicatória e epígrafe sem título; resumo/abstract em parágrafo único simples; títulos primários em página
  nova, 12 pt caixa alta; corpo 1,5 com recuo 1,25 cm; referências à esquerda em espaço simples. Folha de aprovação
  **não** inserida (decisão dos autores; pendência P4-01).
- **AT-20** Apêndice D sem as três fotos de monitor com planilhas (repetiam o Anexo A); numeração das figuras refeita
  automaticamente (Ap. D 48–56, Ap. E 57–62, Anexo A 63–66). Capturas dos relatórios (T14, T18–T23) em 1920×1080 para
  mostrar os quatro cartões de KPI lado a lado; demais telas em 1366×768.
- **AT-21** Os diagramas das Figuras 7–25 **não** foram trocados no `.docx` (sem as fontes originais); versões fiéis ao
  código estão em `docs/tg/analise_fase3/diagramas/` para os autores decidirem.

## Pendências herdadas (não decididas aqui)

- Folha de aprovação; trecho "aprendizados e dificuldades" das Considerações Finais; quadros/figuras não citados antes de
  aparecerem (F1-053/054); figuras do capítulo 4; seed oficial com ocorrências encerradas antes da abertura (tempo médio
  negativo no relatório por bairro); `data_saida`; e-mail à Vigilância; anexos por registro clínico; edição de usuário
  (botão desabilitado na T15). Detalhes: `docs/tg/analise_fase3/relatorio_fase4.md`, `bloqueios.md`, `pendencias_novas.md`.

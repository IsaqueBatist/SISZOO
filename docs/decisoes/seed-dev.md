# Decisões - seed de dados fictícios (`com.siszoo.seed`, branch `feat/dados-reais-seed`)

Uma linha por decisão, no formato de `T29.md`. Origem: missão de eliminação de mocks e população do banco com dados
fictícios (25/10/2026). Substitui o `scripts/seed-test-data.mjs` (SQL direto) e o seed via API da `fix/seed-ficha-completa`
(`500c294`), que se perdeu num merge; ver a nota no topo de `ficha-completa-seed-fuso.md`.

## Decisões

- **SD-0 Mecanismo único: seed Java pelos services reais.**
  - O seed chama os mesmos services que os controllers chamam (`UsuarioService`, `AnimalService`, `VacinacaoService`,
    `OcorrenciaService`, `ProcessoSanitarioService`, `RelatorioGeradoService`…). Regras de negócio, protocolos, ficha
    completa, sigilo e auditoria saem iguais aos da aplicação.
  - Não há SQL de dados de domínio nem evento de auditoria fabricado.
  - O script Node gravava direto no banco e violava regras (baia acima da capacidade, processo em ocorrência encerrada,
    eutanásia sem laudo), com auditoria falsa. Ele e o `package.json` da raiz, que só existia para ele, foram removidos.
- **SD-1 Proteção contra produção, em três camadas.**
  1. **Portão único:** perfil `seed` **e** `siszoo.seed.habilitado=true` (`SISZOO_SEED_HABILITADO`). Só `SeedDevConfig`
     importa as classes do pacote (nenhuma tem `@Component`).
  2. **Guarda de ambiente** (`SeedDevGuarda`, ativa com o perfil `seed` mesmo sem o habilitado): exige `dev` ou `test` e
     recusa `docker` ou `prod`; a subida falha. O perfil `prod` passou a existir (mesma configuração do `docker`, em
     `application.yml`).
  3. **Guarda de banco**, antes de qualquer escrita: sem `seed_controle` e com dado de domínio alheio (animal, ocorrência,
     processo ou usuário além do admin inicial), recusa sem gravar nada. Também recusa o inverso: `seed_controle` vazia
     com usuários `*.seed@`.
  - Nem o `docker-compose.yml` nem o `Dockerfile` ligam o seed.
- **SD-2 Idempotência: um passo por chamada de service.**
  - Cada passo tem uma chave estável (`animal:017`, `processo:12:resultado`…) gravada em `seed_controle` na mesma
    transação do service, sob `pg_advisory_xact_lock`.
  - Reexecutar pula o que tem chave. Uma falha desfaz só o passo em curso, e a execução seguinte retoma dali.
  - Uma transação por passo, como uma requisição HTTP por ação. Com duas chamadas no mesmo contexto de persistência,
    `trocarSenha` reencontrava o `Usuario` recém-criado com o vínculo de cargo ainda sem id, e o `merge` quebrava; na API
    isso não acontece.
- **SD-3 `seed_controle` não é migration.**
  - É criada pelo seed (`CREATE TABLE IF NOT EXISTS`), então só existe num banco em que ele rodou, nunca no schema de
    produção. Flyway e `ddl-auto=validate` ignoram a tabela.
  - Nunca deve ser limpa à mão. Se faltar a linha de um registro com chave natural (e-mail, microchip, nome de
    categoria), o seed adota o registro com WARN.
  - Os demais registros não têm chave natural. Para semear de novo, recrie o banco; os triggers V14/V17/V25/V27 já
    impedem apagar registros clínicos, processos e auditoria.
- **SD-4 Sem e-mail real.**
  - Processo com resultado notificável (positivo ou inconclusivo, inclusive o que é retificado depois) tem responsável
    **sem e-mail**. O `NotificacaoResultadoService` não envia, e o `REQUIRES_NEW` de `registrarNotificacaoMunicipe`
    (único do código, chamado só no callback do SMTP aceito, depois do commit) nunca roda. Não há gravação órfã.
  - Os demais e-mails usam `@exemplo.test` (RFC 2606). CPF é sempre nulo; telefones têm prefixo `0000`, que não existe na
    numeração brasileira.
  - Teste: `data_notificacao_municipe IS NULL` em todos os processos (`SeedDevIT`).
- **SD-5 Datas de negócio relativas ao `Clock`; o resto com a hora real.**
  - Datas de abertura, aplicação, coleta e resultado vêm de "hoje" do `Clock` e nunca são futuras. Os services não foram
    alterados para aceitar datas retroativas.
  - O que o próprio service carimba fica com a hora real da execução: `criado_em`, encerramento, movimentações,
    auditoria, `gerado_em` e protocolo do ano corrente.
  - Único indicador afetado: **"Tempo médio (h)"** do relatório Ocorrências por Bairro (`criado_em` → `encerrada_em`),
    que fica ≈0 h para as ocorrências encerradas pelo seed. Decisão: aceitar e documentar.
  - As datas congelam na primeira execução. Com os dias, vacinas "vencendo" viram "vencidas" e "registradas hoje" vai a 0.
    Para renovar, recrie o banco.
- **SD-6 RBAC e validação repetidos.**
  - Os services não conferem `@PreAuthorize` nem `@Valid`. O seed repete as duas checagens:
    - `SeedAtor.executar` exige a autoridade do endpoint equivalente, com as autoridades reais do cargo
      (`AutoridadeService`);
    - `SeedExecutor.valido` passa o DTO pelo `Validator`.
  - Cada passo roda como o perfil que faz aquilo na prática: admin cria baias, veterinário registra animais, clínico e
    resultados, agente registra ocorrências e processos vinculados.
  - O `SecurityContext` é limpo no `finally` de cada passo.
- **SD-7 Execução no `ApplicationReadyEvent`.**
  - Roda depois do `DataSeeder`, que cria o admin inicial e é o autor dos usuários do seed.
  - `siszoo.seed.executar-na-subida=false` mantém o bean sem rodar; os testes usam essa opção.
  - Os caches do dashboard são limpos ao final.
- **SD-8 Override do compose para desenvolvimento** (`docker-compose.seed.yml`, pedido em 25/10/2026).
  - Sobe o mesmo stack com o backend em `dev,seed` e `SISZOO_SEED_HABILITADO=true`.
  - Usa o projeto `siszoo-seed`, com containers e volume próprios; o banco do stack normal não é tocado.
  - Traz chave JWT e admin inicial de desenvolvimento como padrão; o `.env` tem precedência.
  - Troca aceita: dentro desse container a guarda de perfil passa, porque o perfil é `dev`. A proteção contra uso
    indevido fica nas outras camadas: o arquivo é separado e opt-in, e a guarda de banco recusa qualquer banco com dados
    reais. O arquivo e o README dizem para nunca usá-lo num servidor.

- **SD-9 Fotos reais dos animais (revisão de 01/11/2026).**
  - Revisa a frase "nenhum arquivo binário versionado e nenhuma imagem real" que valia para `ArquivosFicticios`: os 32
    animais passaram a ter fotografia, para a listagem, a ficha e as baias ficarem fiéis ao uso real do sistema.
  - As fotos são fotografias de domínio público (CC0) do Wikimedia Commons, redimensionadas para lado maior de 640 px e
    recomprimidas em JPEG (75%), entre 20 e 150 KB cada (cerca de 1,9 MB no total), em
    `backend/src/main/resources/seed/fotos/NNN-nome.jpg`. Fonte, autor e licença de cada uma em `CREDITOS.md`, na mesma
    pasta. Nenhuma retrata um animal real do CCZ.
  - O nome do arquivo deriva do plano (`ArquivosFicticios.nomeDaFoto`): todo animal tem foto, e `SeedPlanoTest` falha se
    faltar, se não for JPEG legível ou se passar de 800 px ou 200 KB. A seed envia a foto como data URI em `fotoUrl`,
    exatamente como o frontend, e o `AnimalService` gera `foto_miniatura`. Os anexos (PNG e PDF) continuam gerados em
    código.
  - Idempotência inalterada: um banco já semeado não recebe as fotos; recrie o banco.

- **SD-10 Cobertura das lacunas de catálogo e de limites (revisão de 02/11/2026).**
  - Motivo: a massa era grande, mas havia funcionalidade real que **nenhum registro exercitava**. O critério desta
    revisão foi fechar essas lacunas, não aumentar volume: cada registro novo existe para tornar demonstrável uma
    regra, um estado de coluna ou um limite temporal que antes não aparecia em tela nenhuma.
  - **Espécies**: entram 3 quirópteros e 2 primatas. Antes, `quiroptero` não tinha nenhum animal no canil (só amostra
    de campo) e `pnh` tinha um. As 4 espécies do catálogo passam a ter animal, com baia de isolamento própria —
    silvestre não divide recinto com cão e gato.
  - **Três estados de `animal.esterilizado`** (V31): o plano passava sempre `true`/`false` e nunca `null`. O novo
    `castracaoNaoInformada()` cobre o "não informado". Isso **expõe de propósito** uma divergência real do código: o
    alerta de 72 h (`listarNaoEsterilizadosComEntradaAntesDe`) e o KPI `nao_castrado`
    (`countByEsterilizadoFalseAndStatus_Codigo`) filtram por `= false`, então o animal "não informado" não aparece em
    nenhum dos dois. A massa demonstra o comportamento; a divergência fica como pendência, não é corrigida aqui.
  - **Limites de 72 h** (`AlertaEsterilizacaoService`): o `DatasSeed` só tinha granularidade de dias, e nenhum animal
    ficava perto do limite. Novo `entradaHorasAtras(int)` posiciona animais com 6 h e 60 h (fora do alerta) e 73 h e
    200 h (dentro). **O limite é de 72 horas, não de 72 dias** — não existe prazo de castração em dias no sistema,
    nem agendamento, nem data de vencimento de castração.
    Prazo de validade das janelas estreitas, pela SD-5: o alerta recalcula o limite a cada requisição com a hora
    corrente, então o animal de 60 h entra no alerta 12 h depois da execução do seed e o de 6 h, 66 h depois. Para
    renovar, recrie o banco.
  - **Limites das outras janelas**: vacinas com validade em 0, +7 e +8 dias (a de +8 fica fora da janela de 7 dias do
    `AlertaVacinalService`, provando o corte) e −1 dia (vencida); prescrições ATIVAS terminando em +7 (entra em
    `medicacao_ativa`) e +8 (não entra).
  - **Colunas que eram mortas na massa**: `data_nascimento_aprox`, `animal_condicao_saude` + `condicoes_outras`
    (V33), `ocorrencia.animal_id` (V35, 6 ocorrências com animal recolhido — acende o `CardAnimalRecolhido` e o
    `OrigemAnimalController`), os 4 tipos de `tipo_destino_transferencia` (antes só `ENTIDADE_PROTECAO`),
    `animal_amostrado.contato_humano IS NULL` (alimenta o KPI `contatoNaoInformado` do relatório anual, que ficava em
    zero) e a identificação completa da amostra de campo (`raca`, `coloracao`, `pelagem`, `idade_aprox`,
    `alteracao_comportamental`, `observacoes`).
  - **Catálogo sem uso**: `vacina.gripe_canina`, `tipo_procedimento.vacinacao`, `tipo_exame.ultrassonografia`,
    `sintoma.hemorragia_interna`, `desfecho_animal.obito_natural` e `obito_outro`, `ViaAdministracao.TOPICA` e
    `INTRAVENOSA`, `UnidadeDose.UNIDADE_INTERNACIONAL`. Continuam sem uso, de propósito:
    `resultado_laboratorial.aguardando` (o service recusa lançá-lo) e o medicamento inativo (o `PrescricaoService`
    não checa `ativo`, e prescrevê-lo pareceria defeito numa apresentação).
  - **Desfecho só em amostra de campo.** `registrarResultado` grava `desfecho_animal` no processo e **não** altera o
    animal. Um desfecho de óbito num processo cuja amostra é do canil deixaria o animal vivo no canil e morto no
    processo. Por isso os desfechos de óbito ficam em amostras de campo, e o processo de raiva no quiróptero do canil
    (vivo, em isolamento) usa saliva e `em_acompanhamento`.
  - **Anexos perto do limite**: 5 num animal (limite 10) e 5 numa ocorrência (limite exato, o 6º daria 4xx).
  - **Capacidade das baias.** As 6 baias antigas tinham 4 vagas livres no total, e ocupá-las deixaria Gatil G1,
    Canil A1 e Canil A2 superlotados, desfigurando os indicadores de ocupação. Entram 3 baias (Isolamento I1,
    Canil A3 e Gatil G2); Canil Externo B1 e Quarentena Q1 seguem lotadas de propósito.
  - **Chaves de `seed_controle` compatíveis.** O primeiro anexo de ocorrência mantém a chave sem sufixo
    (`ocorrencia:06:anexo`) e exames e anexos de animal passam a ter `ordem`, com `ordem = 1` reproduzindo a chave
    antiga (`exame:012.1`). Um banco semeado com a versão anterior não ganha registro duplicado na reexecução.
  - **Fotos provisórias.** Os 18 animais novos entram com imagem **gerada em código** (ruído com a legenda "FOTO
    PROVISORIA"), e não com fotografia CC0: a pesquisa e a verificação de licença no Wikimedia Commons ficaram para
    os autores. A escolha foi commitar as provisórias para `verify` e seed continuarem verdes, em vez de deixar a
    branch vermelha. Trocar cada uma é só substituir o arquivo mantendo o nome — não há código a mexer. A lista com
    espécie, raça e cor de cada animal está em `fotos-seed-pendentes.md`, e a ressalva de licença, no `CREDITOS.md`.

## Massa

Estado em 02/11/2026 (SD-10). As quantidades exatas vêm das tabelas-plano (`*Seed.PLANO`, `VACINAS`,
`PRESCRICOES`…), e o `SeedDevIT` as confere derivando dos planos, sem número cravado.

| Entidade | Quantidade | Cobertura |
|---|---|---|
| Usuários | 8 (+ admin inicial) | 1 admin, 3 veterinários (1 em primeiro acesso), 4 agentes (1 desativado). Senha única `Ficticio#2026`, com hash do `PasswordEncoder`. **Inalterados pela SD-10** |
| Categorias / medicamentos | 4 / 8 | 1 medicamento inativo |
| Baias | 9 | duas lotadas (alerta), uma perto do limite, dois gatis, uma quarentena, um isolamento de silvestres, uma inativa |
| Animais | 50 | **28 caninos, 16 felinos, 3 quirópteros, 3 primatas** — as 4 espécies do catálogo. 35 sob custódia e 15 fora (6 adotados, 4 transferidos nos 4 tipos de destino, 3 óbitos naturais, 2 eutanásias com laudo). Esterilização nos 3 estados (`true`/`false`/não informado) e limites de 72 h nos dois lados |
| Vacinações / procedimentos / prescrições / exames | 48 / 53 / 16 / 16 | validade em 0, +7, +8 e −1 dia (o +8 prova o corte da janela de 7 dias); sem avaliação há 30 dias; prescrições ATIVAS terminando em +7 e +8; 1 retificação de cada |
| Anexos de animal | 8 | até 5 num mesmo animal (limite 10); PNG e PDF gerados em código |
| Ocorrências | 36 | 10 abertas (2 de hoje), 12 em atendimento, 14 encerradas (todas as 7 providências, inclusive `registro_indevido`); sigilosas, anônimas, 9 notas, 7 anexos (até 5 numa só), **6 com animal recolhido** |
| Processos | 29 | 4 status, 6 doenças, 4 laboratórios, raiva em cão, gato e morcego (de campo **e do canil**); positivos (nunca retificados), 2 retificações, 6 vínculos com ocorrência, os 4 desfechos, contato humano nos 3 estados, 12 de 12 sintomas |
| Relatórios gerados | 6 | 1 por tipo, PDF e CSV |

## Cenários que a massa não representa porque o sistema não os tem

Levantado em 02/11/2026, ao desenhar a SD-10. Nada foi acrescentado ao sistema para acomodar estes pedidos; ficam
aqui para não serem descritos como existentes numa apresentação ou no TG.

- **Prazo, SLA, data limite ou atraso de ocorrência**: não existe em nenhuma camada (migrations V1–V38, backend e
  frontend). As únicas datas da ocorrência são abertura, hora de abertura, encerramento e os carimbos de auditoria.
  O único tempo medido é retrospectivo — `criado_em → encerrada_em` das já encerradas, no relatório de bairros, sem
  meta de comparação. Logo, "ocorrência com prazo próximo" e "ocorrência atrasada" são irrepresentáveis.
- **Prioridade com níveis** (alta/média/baixa): não existe. Só os booleanos `ocorrencia.urgente` e
  `processo_sanitario.urgente`. A listagem ordena por `urgente DESC`, então o urgente sobe ao topo — é tudo.
- **Castração agendada, pendente, próxima do vencimento ou vencida**: não existe. O sistema tem `esterilizado`
  (3 estados), `data_esterilizacao` (não futura, só quando `esterilizado = true`), o procedimento `castracao` (que
  marca `esterilizado = true` e guarda a data mais antiga), o alerta de **72 horas** desde a entrada e o KPI
  `nao_castrado`. Não há data de vencimento nem agendamento.
- **Status "resolvida" ou "pendente"** de ocorrência: os únicos são `ABERTA`, `EM_ATENDIMENTO` e `ENCERRADA`.
  "Pendentes" é um filtro de interface, equivalente a ABERTA + EM_ATENDIMENTO.
- **Origem da ocorrência** (telefone, balcão, 156, e-mail): não existe campo.
- **Tratamento concluído automaticamente**: `prescricao.status` vem do cliente e nenhum job o transiciona. Uma
  prescrição esquecida em `ATIVA` fica `ATIVA`. "Em andamento" e "concluído" são o valor gravado, nada derivado.
- **Alerta de dashboard de ocorrência ou de processo**: os 8 alertas do backend são todos de animais, baias e
  prescrições. O card de processos urgentes é montado no frontend (`useAlertaProcessosUrgentes`) filtrando
  `urgente=true`, sem olhar status — conta até os concluídos.
- **Tabela de alertas**: não existe. Todo alerta é calculado em runtime, sem persistência, sem reconhecer/silenciar
  e sem histórico.
- **Tempo médio do relatório de bairros ≈ 0 h**: consequência conhecida da SD-5, já documentada acima.

## Testes

- **`SeedDevIT`**:
  - roda na subida, num banco próprio;
  - confere as contagens exatas;
  - roda mais duas vezes e compara um retrato de todas as tabelas, da auditoria por entidade/ação e de
    `protocolo_sequencia` (idêntico, 0 criados);
  - confere invariantes e o `SecurityContext` nulo;
  - cenário pela API real: login com a senha documentada, os 7 alertas maiores que 0, 2+ páginas nas listagens, 403
    para o veterinário em ocorrências e denunciante sigiloso mascarado.
- **`SeedDevBancoComDadosIT`**: banco com dados alheios → recusa, contagens iguais, sem `seed_controle`.
- **`SeedDevInativoIT`**: sem o perfil, nenhum bean do seed e nenhuma tabela.
- **`SeedDevGuardaTest`**: combinações de perfil e o portão do `habilitado`.
- **`SeedPlanoTest`**: coerência das tabelas-plano sem banco (política de senha, ocupação, laudo, resultados, vínculos,
  chaves únicas).
- O seed expôs um bug real: as contagens de ocorrência do dashboard e do relatório ignoravam as não encerradas (INNER
  JOIN implícito). Ele foi corrigido em `OcorrenciaRepository`, com regressão em `DashboardControllerIT` e
  `RelatorioControllerIT`.

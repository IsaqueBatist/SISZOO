# Decisões — seed de dados fictícios (`com.siszoo.seed`, branch `feat/dados-reais-seed`)

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

## Massa

| Entidade | Quantidade | Cobertura |
|---|---|---|
| Usuários | 8 (+ admin inicial) | 1 admin, 3 veterinários (1 em primeiro acesso), 4 agentes (1 desativado). Senha única `Ficticio#2026`, com hash do `PasswordEncoder` |
| Categorias / medicamentos | 4 / 8 | 1 medicamento inativo |
| Baias | 6 | uma lotada (alerta), uma perto do limite, um gatil, uma quarentena, uma inativa |
| Animais | 32 | 21 sob custódia (2 páginas na listagem) e 11 fora (6 adotados, transferido, óbitos, eutanásia com laudo) |
| Vacinações / procedimentos / prescrições / exames | 38 / 35 / 12 / 11 | vencendo e vencidas, sem avaliação há 30 dias, prescrições terminando em 7 dias, 1 retificação de cada |
| Anexos de animal | 3 | PNG e PDF gerados em código |
| Ocorrências | 26 | 8 abertas (2 de hoje), 7 em atendimento, 11 encerradas (todas as providências, inclusive `registro_indevido`); sigilosas, anônimas, notas, anexos |
| Processos | 24 | 4 status, 6 doenças, 4 laboratórios, raiva em cão, gato e morcego; positivos (nunca retificados), 2 retificações, 5 vínculos com ocorrência |
| Relatórios gerados | 6 | 1 por tipo, PDF e CSV |

As quantidades exatas vêm das tabelas-plano (`*Seed.PLANO`, `VACINAS`, `PRESCRICOES`…), e o `SeedDevIT` as confere.

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

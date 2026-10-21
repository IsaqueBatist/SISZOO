# Roteiro de testes manuais — processos, auditoria de RN, animais e clínico

Cobre o que entrou nos PRs abaixo. Teste a `main` atual (ou a branch que estiver em revisão, se ela mexer nesses módulos).

| PR | Branch | O que entrou |
|---|---|---|
| #94 | `feat/T34-registro-resultado-status` | Lançamento de resultado laboratorial, máquina de status do processo, histórico imutável (V14) |
| #98 | `fix/T34-follow-up` | Data do resultado sem limite inferior, CONCLUIDO exige resultado, V15 (integridade + TRUNCATE), notificação só p/ positivo |
| #99 | `fix/auditoria-rn-rebase` | Autor da auditoria de usuário, sigilo nas respostas de mutação, token de usuário desativado, microchip normalizado (V16), registros críticos sem DELETE (V17) |
| #100 | `feat/animais-clinico-correcoes` | Fuso de SP, datas do animal/procedimento/prescrição, baia ativa+vaga com trava, ficha completa (V18), rascunhos nos modais, tela de Medicamentos/categorias |
| — | `fix/ficha-completa-seed-fuso` | Seed sem cópia da regra de ficha completa, testes de fuso com instante fixo, "hoje" único no front, mock e Insomnia com a regra atual, tela da ficha mostrando ficha incompleta, `esterilizado` ausente → 422 |

Legenda: **[UI]** navegador · **[API]** PowerShell · **[DB]** psql · ☐ marque ao passar.

---

## 0. Preparação

Suba o ambiente e semeie os dados de teste. O seed precisa do **backend no ar**: as vacinações vão pela API, e é o backend que calcula a ficha completa.

```powershell
docker compose up -d --build   # banco, backend (aplica as migrations) e frontend
npm install
npm run db:seed                 # idempotente: rodar de novo não insere nada
npm run test:seed               # confere a ficha completa de todos os animais
```

Um banco semeado por uma versão anterior do seed (que gravava `ficha_completa` = "tem microchip") tem animais "completos" sem vacina, e o `test:seed` falha nele. Siga o procedimento de `docs/decisoes/ficha-completa-seed-fuso.md` (seção "Procedimento"): recriar o banco, que **apaga os dados**, ou, se houver dados a preservar, diagnosticar e editar/salvar esses animais pela tela.

☐ Conferir migrations: `docker exec siszoo-db-1 psql -U postgres -d siszoo -c "select version, success from flyway_schema_history order by installed_rank desc limit 5;"` → 18, 17, 16, 15, 14 todos `t`.

**Usuários** (senha `Teste@123`), front em http://localhost:5173:

| Perfil | E-mail |
|---|---|
| Admin | `ana.admin.teste@itu.sp.gov.br` |
| Veterinário | `bruno.veterinario.teste@itu.sp.gov.br` |
| Agente | `diego.agente.teste@itu.sp.gov.br` |

**Atalhos de API** (cole uma vez no PowerShell):

```powershell
$API = "http://localhost:8080/api"
function Login($email) { (Invoke-RestMethod -Method Post "$API/auth/login" -ContentType "application/json" -Body (@{email=$email; senha="Teste@123"} | ConvertTo-Json)).token }
function Api($metodo, $caminho, $corpo = $null, $tok = $ADM) {
  $p = @{ Method = $metodo; Uri = "$API$caminho"; Headers = @{ Authorization = "Bearer $tok" } }
  if ($corpo) { $p.ContentType = "application/json; charset=utf-8"; $p.Body = [Text.Encoding]::UTF8.GetBytes(($corpo | ConvertTo-Json -Depth 6)) }
  try { Invoke-RestMethod @p | ConvertTo-Json -Depth 6 } catch { "HTTP $($_.Exception.Response.StatusCode.value__): $($_.ErrorDetails.Message)" }
}
function Sql($q) { docker exec siszoo-db-1 psql -U postgres -d siszoo -c $q }
$ADM = Login "ana.admin.teste@itu.sp.gov.br"; $VET = Login "bruno.veterinario.teste@itu.sp.gov.br"; $AGE = Login "diego.agente.teste@itu.sp.gov.br"
```

> **Dados do seed que os testes abaixo usam:** a Baia 01 tem capacidade 2 e 3 animais (o seed grava direto no banco, sem a regra de vaga); as Baias 07 e 08 estão cheias; a Baia 04 está vazia (cap. 2). Apolo, Rocky, Bolt, Frajola e Chico têm microchip e nenhuma vacina, então a ficha deles é **incompleta**.

---

## 1. Processos sanitários — resultado e status (PR #94 e #98)

### 1.1 Fluxo feliz pela tela [UI] — logado como Agente
1. ☐ Processos Sanitários → novo processo (com pelo menos uma amostra). Salvar.
2. ☐ No detalhe: status **Aberto**; card "Resultado Laboratorial" diz *"Aguardando o envio das amostras ao laboratório."*
3. ☐ Clicar **"Avançar status do processo (provisório)"** → status **Aguardando resultado**. O botão some e aparece *"Lance o resultado laboratorial no card ao lado para avançar este processo."*
4. ☐ Card "Registrar resultado": o select **não** oferece "Aguardando"; oferece positivo, negativo, inconclusivo, material inadequado, não realizado.
5. ☐ Data do resultado: vem preenchida com **hoje**; o calendário não deixa escolher amanhã.
6. ☐ **Data anterior à abertura é aceita** (T34-5): escolha uma data de meses atrás. Não pode aparecer bloqueio.
7. ☐ Escolher **Inconclusivo** + um desfecho → Registrar. **Não** aparece modal de confirmação. Status vira **Com resultado**, card fica somente leitura com badge, data, desfecho e "Histórico: Lançado Inconclusivo em …". **Sem** alerta de notificação.
8. ☐ Botão de avançar → **Concluído**; aparece *"Processo concluído."* e nenhum botão.

### 1.2 Positivo notifica [UI]
1. ☐ Novo processo → avançar até Aguardando resultado → escolher **Positivo** → Registrar.
2. ☐ Abre modal *"Confirmar lançamento do resultado"* com aviso de notificação. **Cancelar** → nada gravado (recarregue a página e confira que ainda está em Aguardando resultado).
3. ☐ Repetir e **Confirmar** → card mostra *"Notificação solicitada ao responsável."*
4. ☐ `docker logs siszoo-backend-1 --tail 50` → tentativa de envio de e-mail (falha de SMTP é esperada e **não** pode ter impedido o lançamento).

### 1.3 Perfis [UI]
- ☐ Admin e Veterinário também conseguem lançar (escrita em processos).
- ☐ Entrar com perfil sem escrita, se houver, → card mostra só *"Aguardando resultado do laboratório."*

### 1.4 Regras pela API [API]
Pegue o id de um processo em **Aguardando resultado** (`$P`) e de um em **Com resultado** (`$C`) na URL do detalhe.

| ☐ | Comando | Esperado |
|---|---|---|
| ☐ | `Api POST "/processos/$P/resultados" @{resultado="aguardando"; dataResultado="2026-10-01"}` | 422 |
| ☐ | `Api POST "/processos/$P/resultados" @{resultado="xyz"; dataResultado="2026-10-01"}` | 422 |
| ☐ | `Api POST "/processos/$P/resultados" @{resultado="negativo"; dataResultado="2099-01-01"}` | 422 (data futura) |
| ☐ | `Api POST "/processos/$P/resultados" @{resultado="negativo"}` | 422 (data obrigatória) |
| ☐ | `Api POST "/processos/$P/resultados" @{resultado="negativo"; dataResultado="2020-01-01"}` | 200/201, aceita data antiga |
| ☐ | De novo o mesmo POST em `$P` (sem `retificaId`) | **409** (resultado já registrado) |
| ☐ | `Api GET "/processos/$P"` → copie `resultados[0].id` para `$R` | — |
| ☐ | `Api POST "/processos/$P/resultados" @{resultado="positivo"; dataResultado="2026-10-10"; retificaId="$R"}` | Sucesso: correção. GET mostra 2 itens no histórico, o original intacto, vigente = positivo. Na tela: "Correção para Positivo…" e alerta de notificação (passou a positivo) |
| ☐ | Mesmo POST de novo com o **mesmo** `$R` (que não é mais o vigente) | 422 |
| ☐ | `Api PATCH "/processos/$P/status" @{status="CONCLUIDO"}` e depois uma correção com `retificaId` do vigente | Conclusão OK; correção depois de concluído → 422 |
| ☐ | Num processo **Aberto**: `Api PATCH "/processos/<id>/status" @{status="COM_RESULTADO"}` | 422 (pula etapa) |
| ☐ | Num **Aguardando resultado**: `Api PATCH "/processos/<id>/status" @{status="COM_RESULTADO"}` | 422 (só pelo POST de resultado) |
| ☐ | Num **Aberto**: `Api PATCH "/processos/<id>/status" @{status="CONCLUIDO"}` | 422 |
| ☐ | `Api POST "/processos/$P/resultados" @{resultado="negativo"; dataResultado="2026-10-01"; desfechoAnimal="nao_existe"}` (num processo novo em Aguardando) | 422, nada gravado |
| ☐ | Sem token: `Invoke-RestMethod -Method Post "$API/processos/$P/resultados"` | 401 |
| ☐ | `Api PUT "/processos/$P/resultados"` / `Api DELETE ...` | 405 |

### 1.5 Imutabilidade no banco [DB]
Todos os comandos vão dentro de `begin; … rollback;`: se algum trigger falhar, nada é apagado de verdade.

| ☐ | Comando | Esperado |
|---|---|---|
| ☐ | `Sql "begin; update resultado_processo set observacoes='x'; rollback;"` | erro do trigger |
| ☐ | `Sql "begin; delete from resultado_processo; rollback;"` | erro do trigger |
| ☐ | `Sql "begin; truncate resultado_processo; rollback;"` | erro (trigger de TRUNCATE da V15) |
| ☐ | `Sql "\d resultado_processo"` | existe o CHECK `retifica_id <> id` e o índice `ix_resultado_processo_processo_id` |

---

## 2. Auditoria de regras de negócio (PR #99)

### 2.1 Autor da auditoria de usuário (AR-1) [UI + DB]
1. ☐ Como Admin, Usuários → criar um usuário novo (e-mail só letras/ponto `@itu.sp.gov.br`), depois desativar e reativar.
2. ☐ `Sql "select acao, usuario_id, entidade_id, criado_em from auditoria_evento order by criado_em desc limit 3;"` → `usuario_id` é o **id da Ana** (`10000000-0000-4000-8000-000000000001`), `entidade_id` é o usuário criado.

### 2.2 Token de usuário desativado (AR-4) [UI]
1. ☐ Em uma janela anônima, logar como **Diego (agente)** e deixar aberto.
2. ☐ Na janela normal, como Admin, **desativar** o Diego.
3. ☐ Na janela do Diego, navegar/recarregar → volta ao login (401). Pela API: `Api GET "/usuarios/me" $null $AGE` → **401**.
4. ☐ **Reativar o Diego** e gerar o token de novo (`$AGE = Login "diego.agente.teste@itu.sp.gov.br"`).

### 2.3 Sigilo do denunciante nas mutações (AR-2/AR-3) [UI + DevTools]
1. ☐ Como Admin, criar uma **ocorrência sigilosa** com denunciante preenchido.
2. ☐ DevTools → Network aberto. Editar a ocorrência, mudar status, adicionar nota.
3. ☐ A resposta de cada PUT/PATCH/POST traz o denunciante **mascarado**; logo depois sai um GET do detalhe e a tela mostra o denunciante **completo** (não fica bloco vazio).
4. ☐ Logado como Agente: mesmo comportamento (Agente vê sigiloso pela D6).

### 2.4 Microchip normalizado (AR-5/V16) [UI + API]
1. ☐ Cadastrar animal com microchip `" 777 888 999 "` → ficha mostra `777888999`.
2. ☐ Cadastrar outro com `777888999` (ou `777 888999`) → erro de **microchip já cadastrado** (409).
3. ☐ Busca na lista de animais por `777 888 999` encontra o animal.
4. ☐ Cadastrar dois animais **sem** microchip (campo vazio) → ambos aceitos (vazio vira `null`, não colide).
5. ☐ Caixa não é normalizada: `abc123` e `ABC123` são aceitos como diferentes.

### 2.5 Registros críticos sem exclusão (V17) [DB]
Sempre com `begin; … rollback;`: se o trigger não funcionar, o rollback desfaz a exclusão.

| ☐ | Comando | Esperado |
|---|---|---|
| ☐ | `Sql "begin; delete from vacinacao where id = (select id from vacinacao limit 1); rollback;"` | falha com `check_violation` |
| ☐ | Idem para `procedimento`, `prescricao`, `processo_sanitario` | falha |
| ☐ | `Sql "begin; truncate vacinacao; rollback;"` e `Sql "begin; truncate animal cascade; rollback;"` | falha |
| ☐ | `Sql "begin; update procedimento set descricao = descricao where id = (select id from procedimento limit 1); rollback;"` | **passa** (UPDATE não é bloqueado) |

---

## 3. Animais, clínico, baias e medicamentos (PR #100)

### 3.1 Datas do animal (RN-AN01) [UI]
Animais → Cadastrar:
- ☐ Data de entrada amanhã → erro no campo, não envia.
- ☐ Nascimento futuro → erro no campo.
- ☐ Nascimento **depois** da entrada → erro no campo de nascimento.
- ☐ Nascimento = entrada = hoje → aceita.
- ☐ Marcar castrado, pôr data de castração futura → erro.
- ☐ Pôr data de castração e trocar para **"Não castrado"** → a data é limpa.
- ☐ Repetir as regras na **edição** de um animal existente.

[API] erro 422 por campo (o front bloqueia antes, então só dá para ver pela API):
```powershell
Api POST "/animais" @{nome="Teste"; especie="canino"; sexo="macho"; status="em_quarentena"; motivoEntrada="resgate"; dataEntrada="2026-10-19T10:00:00"; esterilizado=$false; dataEsterilizacao="2026-10-01"}
```
☐ → 422 com `campos: [{campo: "dataEsterilizacao", ...}]`. Troque por `dataEntrada="2099-01-01T10:00:00"` → `campos` com `dataEntrada`.

☐ Sem o campo `esterilizado` (tire `esterilizado=$false` do corpo acima), no cadastro e na edição (`Api PUT "/animais/<id>" ...`) → **422** `{"mensagem": "Dados invalidos", "campos": [{"campo": "esterilizado", ...}]}`, o mesmo formato dos outros campos obrigatórios. Antes respondia 400 genérico.

☐ Permissão vem antes da validação: `Api POST "/animais" @{} $AGE` (Agente só lê animais) → **403** "Acesso negado"; o mesmo corpo vazio com `$ADM` → **422** "Dados invalidos"; sem token → **401**. Antes, o Agente recebia 422.

### 3.2 Baia ativa e com vaga (RN-AN02/AN03) [UI + API]
- ☐ Cadastro: Baias 07 e 08 (cheias) e Baia 01 (3/2) aparecem como **"(superlotada)"** e desabilitadas.
- ☐ API: `Api POST "/animais" @{...mesmo corpo válido...; baiaId="30000000-0000-4000-8000-000000000007"}` → **409** *"Baia informada ja atingiu a capacidade"*.
- ☐ **Quem já está na baia não é barrado**: editar um animal da Baia 01 (que está 3/2) mudando só o peso/observação → salva normalmente.
- ☐ Gestão de Baias: desativar a Baia 04 → cadastro de animal na Baia 04 pela API → **409** *"Baia informada esta inativa"*. Reativar depois.
- ☐ Volta à custódia: um animal da Baia 07 → mudar status para **adotado** (salva) → baia 07 fica com vaga → ocupe a vaga com outro animal → volte o primeiro para **em_quarentena** na mesma baia → **409**.
- ☐ Animal com status fora da custódia (adotado/óbito/transferido) cadastrado numa baia cheia → **aceito** (não ocupa vaga).
- ☐ (Opcional, concorrência) 4 cadastros simultâneos na Baia 04 com 1 vaga só:
  ```powershell
  1..4 | ForEach-Object { Start-Job -ArgumentList $ADM,$_ -ScriptBlock { param($t,$i)
    $b = @{nome="Corrida$i"; especie="canino"; sexo="macho"; status="em_quarentena"; motivoEntrada="resgate"; dataEntrada="2026-10-19T10:00:00"; esterilizado=$false; baiaId="30000000-0000-4000-8000-000000000004"} | ConvertTo-Json
    try { Invoke-RestMethod -Method Post "http://localhost:8080/api/animais" -Headers @{Authorization="Bearer $t"} -ContentType "application/json" -Body $b | Out-Null; "ok" } catch { $_.Exception.Response.StatusCode.value__ } } } | Wait-Job | Receive-Job
  ```
  (deixe a Baia 04 com 1 vaga antes) → exatamente **1 ok** e o resto **409**.

### 3.3 Ficha completa (RN-AN04/V18) [UI + API]
O subtítulo da ficha do animal mostra **"Ficha completa"** ou **"Ficha incompleta"** (em destaque) conforme `fichaCompleta` da API. Para conferir o valor cru: `Api GET "/animais/<id>"`.
- ☐ **Apolo** (microchip, sem vacina) → subtítulo **"Ficha incompleta"**.
- ☐ Registrar uma vacina no Apolo e recarregar → **"Ficha completa"**.
- ☐ Cadastrar animal novo **com** microchip e sem vacina → **"Ficha incompleta"**.
- ☐ Animal **sem** microchip com vacina → **"Ficha incompleta"**.

### 3.4 Procedimento e prescrição (RN-C07/C08) [UI]
Na ficha de um animal:
- ☐ Procedimento com data de amanhã → bloqueado no campo.
- ☐ Procedimento com descrição/resultado em branco → salva; `Sql "select descricao, resultado from procedimento order by criado_em desc limit 1;"` → `NULL` (não string vazia).
- ☐ Prescrição com término previsto antes do início → erro no campo.
- ☐ Prescrição com término real antes do início → erro.
- ☐ Status **Concluída** sem término real → erro.
- ☐ Início no futuro e términos no mesmo dia → **aceito**.
- ☐ API: `Api POST "/procedimentos" @{animalId="<id>"; tipoProcedimento="atendimento_clinico"; data="2099-01-01"}` → 422 com `campos` `data`.

### 3.5 Fuso de São Paulo (AC-1/AC-2) [testes automatizados com instante fixo]
Nada aqui depende da hora em que você roda. Os casos de virada de dia ficam em testes que congelam o relógio. Lembrete: as datas são gravadas no **horário de Brasília** (coluna `timestamp` sem fuso), não em UTC.

Instantes fixos usados (UTC → Brasília):

| Caso | Instante UTC | Em Itu | "Hoje" esperado |
|---|---|---|---|
| 20:59 BRT | `2030-03-15T23:59Z` | 15/03 20:59 | 15/03/2030 |
| 21:00 BRT | `2030-03-16T00:00Z` | 15/03 21:00 | 15/03/2030 |
| 23:59 BRT | `2030-03-16T02:59Z` | 15/03 23:59 | 15/03/2030 |
| 00:00 BRT | `2030-03-16T03:00Z` | 16/03 00:00 | 16/03/2030 |
| virada de mês | `2030-05-01T00:30Z` | 30/04 21:30 | 30/04/2030 |
| virada de ano | `2031-01-01T00:30Z` | 31/12 21:30 | 31/12/2030 |

| ☐ | O que verifica | Onde | Comando |
|---|---|---|---|
| ☐ | "Hoje" do front (`hojeEmItu`, a única função de "hoje" do front), nos 6 instantes | `frontend/src/lib/hojeNoFusoDeItu.test.ts` | `cd frontend; npx vitest run src/lib/hojeNoFusoDeItu.test.ts` |
| ☐ | Formulários de vacina, procedimento e processo (abertura): aceitam o dia de Itu e recusam o dia seguinte, nos 6 instantes | idem | idem |
| ☐ | Backend: "hoje" pelo `Clock` de produção, vacinação aceita o dia de Itu e recusa o seguinte, alerta inclui validade em hoje+7 e exclui hoje+8, nos 6 instantes | `RegrasDeDataNaViradaDoDiaTest` | `cd backend; ./mvnw test -Dtest=RegrasDeDataNaViradaDoDiaTest` |
| ☐ | Protocolo NNN/AAAA: 31/12 21:30 e 23:59 → ano que termina; 01/01 00:00 → ano novo | idem (+ `OcorrenciaTransacaoIT`, 31/12 23:00) | idem |
| ☐ | Exibição DD/MM/AAAA sem "um dia a menos" (não lê relógio) | `frontend/src/lib/datas.test.ts` › `formatarDataBR` | `npx vitest run src/lib/datas.test.ts` |
| ☐ | 09:30 gravado como 09:30, não 06:30 (não lê relógio) | `FusoHorarioPersistenciaIT` | `./mvnw verify -Dit.test=FusoHorarioPersistenciaIT` |

Rodar com a máquina nos dois fusos (as duas execuções devem passar):
```powershell
# front
$env:TZ="UTC"; npx vitest run; $env:TZ="America/Sao_Paulo"; npx vitest run; Remove-Item Env:TZ
# back
./mvnw test "-DargLine=-Duser.timezone=UTC"; ./mvnw test "-DargLine=-Duser.timezone=America/Sao_Paulo"
```

Conferência manual que vale em qualquer horário:
- ☐ `Sql "select criado_em from vacinacao order by criado_em desc limit 1;"` logo depois de registrar uma vacina → bate com o relógio de Brasília. Se fosse UTC, estaria 3h à frente a qualquer hora do dia.

### 3.6 Rascunhos (AC-7) [UI]
Para cada um: **modal de vacina**, **procedimento**, **prescrição/medicamento** (na ficha do animal) e **baia** (nova e edição, em Gestão de Baias):
1. ☐ Abrir, digitar alguns campos, **fechar sem salvar**, esperar ~1 s.
2. ☐ Reabrir → banner *"Encontramos um rascunho salvo deste formulário."* com o formulário **vazio**.
3. ☐ **Restaurar rascunho** → campos voltam.
4. ☐ Fechar e reabrir → **Descartar** → banner some e não volta.
5. ☐ Digitar, salvar com sucesso, reabrir → **sem** banner.
6. ☐ Rascunho é por animal: rascunho de vacina do animal A não aparece no animal B.
7. ☐ Queda de rede: DevTools → Network → **Offline**, preencher e enviar (falha) → recarregar a página (volte online) → banner aparece.
8. ☐ Deixar um rascunho, fazer **logout** e login → banner **não** aparece.
9. ☐ Outro usuário no mesmo navegador não vê o rascunho do primeiro.
10. ☐ Cadastro de animal continua com rascunho funcionando (regressão).

### 3.7 Medicamentos e categorias (AC-8) [UI + API]
- ☐ Menu tem **"Medicamentos"** para Admin, Veterinário e Agente.
- ☐ Agente: vê a lista, **não** vê os formulários de cadastro. API: `Api POST "/categorias-farmacologicas" @{nome="Teste"} $AGE` → 403.
- ☐ Veterinário/Admin: criar categoria `"  Antifúngico  "` → aparece como `Antifúngico` (sem espaços nas pontas).
- ☐ Criar `antibiótico` (já existe "Antibiótico") → erro *"Categoria farmacologica ja cadastrada"* (409).
- ☐ Categoria vazia → erro de validação.
- ☐ Cadastrar medicamento usando a categoria nova → aparece na lista; e aparece no modal de prescrição da ficha do animal.

### 3.8 Erros por campo no front (AC-6) [UI]
- ☐ Em qualquer formulário, provocar erro de regra da API que o front não pega antes (ex.: microchip duplicado, baia cheia escolhida pela edição) → mensagem da API aparece no formulário, não um texto genérico.

---

## 4. Regressão rápida (5 min)
- ☐ Login/logout com os três perfis; menu certo para cada um.
- ☐ Dashboard abre (ocupação das baias com dado real).
- ☐ Alertas de vacina abrem e mostram datas corretas.
- ☐ Lista de processos mostra os processos criados com status/resultados corretos.
- ☐ Ocorrência comum (não sigilosa): criar, editar, encerrar.

---

## 5. Coleção do Insomnia [API]
Os UnitTests de animais e baias (`.insomnia/UnitTest/ut_animais_*` e `ut_baias_*`) enviam `esterilizado` e seguem as regras atuais. Em especial:
- ☐ `ut_animais_atualizar_definir_microchip_ausente`: só o microchip não completa a ficha; a primeira vacinação completa.
- ☐ `ut_baias_animal_409_baia_superlotada`: alocar numa baia sem vaga → 409 *"Baia informada ja atingiu a capacidade"*, ocupação continua 1.
- ☐ `ut_baias_excluir_soft_delete_nao_bloqueia_ocupada`: desativar baia ocupada continua permitido (AC-3).

---

## Limitações já documentadas (não abrir bug)
- Não existe tela de **correção** de resultado (só pela API).
- Correção **sem** desfecho mantém o desfecho anterior; não há como limpar desfecho (T34-11, pendente).
- Data futura num processo inexistente responde 422 em vez de 404.
- Procedimento agendado (data futura) é recusado de propósito (pendente CCZ).
- Mudar o dia da entrada do animal grava 00:00.
- Tela de medicamentos lista no máximo 100 ativos, sem editar/desativar.
- Duas criações simultâneas com o mesmo microchip → 409 genérico (P5).
- Cargo alterado só vale no próximo login (P6).
- Erro de microchip no formulário é detectado pelo texto da mensagem.

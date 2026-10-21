# E-mail — serviço de envio e templates (T35)

Infraestrutura de envio reutilizável (issue #36). Hoje o único uso é a
notificação de resultado `positivo` ao munícipe (T36/issue #37,
`NotificacaoResultadoService`). Decisões e pendências: `docs/decisoes/T35.md`.

| Peça | Onde | Papel |
| --- | --- | --- |
| `EmailService` | `backend/.../comum/service/` | Único ponto que fala com o SMTP. `enviar(...)` é `@Async` e devolve `CompletableFuture<Void>`. |
| `EmailTemplateService` | `backend/.../comum/service/` | Renderiza templates Thymeleaf em HTML e texto puro. |
| `EmailTemplateConfig` | `backend/.../comum/config/` | Resolver dos templates em texto puro (`email/*.txt`). |
| Templates | `backend/src/main/resources/templates/email/` | Um `.html` e, opcionalmente, um `.txt` com o mesmo nome. |

## Variáveis de ambiente

Todas são opcionais. Os padrões estão em `application.yml` e repetidos no
`docker-compose.yml`, porque uma variável vazia no compose chegaria como `""`
e anularia o padrão do Spring.

| Variável | Padrão | Uso |
| --- | --- | --- |
| `SMTP_HOST` | `localhost` | Servidor SMTP. |
| `SMTP_PORT` | `25` | Porta. |
| `SMTP_USER` / `SMTP_PASSWORD` | vazio | Credenciais. Nunca são logadas. |
| `SMTP_AUTH` | `false` | `true` quando o servidor exige login. |
| `SMTP_STARTTLS` | `false` | Tenta STARTTLS se o servidor oferecer. |
| `SMTP_STARTTLS_REQUIRED` | `false` | Recusa a sessão se o STARTTLS não for possível. Sozinho, já faz o cliente tentar o STARTTLS. |
| `SISZOO_MAIL_FROM` | `nao-responda@itu.sp.gov.br` | Remetente. **Obrigatório**: se for definido em branco, o backend não sobe (`siszoo.notificacoes.remetente ... ausente`). |

Em produção, use `SMTP_AUTH=true`, `SMTP_STARTTLS=true` e
`SMTP_STARTTLS_REQUIRED=true`. Com isso, a senha nunca trafega em texto
claro.

**SMTPS na porta 465 (TLS direto) não está configurado.** Ver as limitações.

Sem nenhuma variável definida, o backend sobe normalmente. Cada envio falha ao
conectar em `localhost:25`, e a falha aparece como `WARN` (ver abaixo).

## Desenvolvimento local: SMTP sandbox

Use um sandbox que captura as mensagens sem entregar. **Nunca** use uma caixa
real para teste.

- **Mailtrap** (Email Testing → Inbox → SMTP Settings): copie usuário e senha
  do inbox para o `.env`. O `.env.example` já traz o bloco com host
  `sandbox.smtp.mailtrap.io`, porta `2525` e STARTTLS obrigatório.
- **Ethereal** (<https://ethereal.email>, "Create Ethereal Account"): host
  `smtp.ethereal.email`, porta `587`, `SMTP_AUTH=true`, `SMTP_STARTTLS=true`.

Para rodar fora do Docker, exporte as mesmas variáveis antes do
`./mvnw spring-boot:run` (ver README). As mensagens aparecem no painel do
sandbox. O `Message-ID` do log de sucesso identifica cada uma.

## Testes: GreenMail

Os testes nunca falam com um SMTP externo:

- O perfil `test` fixa `spring.mail.*` em `127.0.0.1:25`, sem autenticação, e
  o remetente em `nao-responda@siszoo.test`. Assim, um `SMTP_*` exportado na
  máquina não vaza para a suíte. Nos testes que só tocam no envio de
  passagem, como os de processos, o envio falha ao conectar e só gera um
  `WARN`.
- `EmailServiceIT` sobe o GreenMail (`greenmail-junit5`) numa porta livre e
  aponta o contexto para ele via `@DynamicPropertySource`. Ali se confere
  destinatário, assunto, remetente, partes MIME, template, envio assíncrono e
  log.
- `EmailServiceFalhaSmtpIT` provoca uma falha real de conexão. Os ramos de
  erro e a máscara estão em `EmailServiceTest`, só com Mockito.
- Para conferir o log, use `LogCapturado` (testes de `comum/service`): ele lê
  só o logger do `EmailService`. O console também recebe o log do GreenMail,
  que escreve o endereço completo.
- Endereços de teste: use `.test` (RFC 2606). Nunca um endereço real.

## Como chamar

```java
Map<String, Object> variaveis = Map.of("nome", nome, "protocolo", protocolo);
emailService.enviar(
        destinatario,
        "SISZOO — Assunto",
        emailTemplateService.renderizarHtml("email/meu-template", variaveis),
        emailTemplateService.renderizarTexto("email/meu-template", variaveis)); // opcional
```

- Com o corpo em texto, a mensagem sai como `multipart/alternative`, com texto
  puro e HTML. Sem ele, use a assinatura de três argumentos da issue,
  `enviar(destinatario, assunto, corpoHtml)`: a mensagem sai como um único
  `text/html`. Prefira mandar as duas versões, que passam melhor pelos filtros
  de spam e funcionam em leitores de texto.
- **Tudo é assíncrono, inclusive a validação.** A chamada volta na hora com um
  future. Destinatário ou assunto em branco e falhas de SMTP só aparecem como
  future concluído com erro: quem chama nunca recebe exceção, e o erro já foi
  logado. Quem não precisa do resultado pode ignorar o future, como faz
  `NotificacaoResultadoService`. Para saber o resultado, use
  `future.get(timeout)` ou `whenComplete`, nunca na thread de um request.
- O serviço não decide **quando** notificar. Essa regra fica em cada
  funcionalidade; hoje, só o resultado `positivo` (DER, regra 19).

## Como adicionar um template

1. Crie `templates/email/<nome>.html` (modo HTML). Use `th:text` para todo
   dado dinâmico: ele escapa HTML. Evite `th:utext` com dado vindo do
   usuário. Inclua `<meta charset="UTF-8">`. Comentários internos vão em
   `<!--/* ... */-->`, que o Thymeleaf remove; um `<!-- -->` comum chegaria
   ao destinatário.
2. Opcional, mas recomendado: crie `templates/email/<nome>.txt` (modo TEXT),
   com `[(${variavel})]` para os valores. Comentários internos vão em
   `/*[- ... -]*/`.
3. Renderize com `renderizarHtml("email/<nome>", vars)` e
   `renderizarTexto("email/<nome>", vars)`.
4. Teste a renderização e o envio contra o GreenMail, como em
   `EmailServiceIT.enviaTemplateRenderizado`.

O texto de `resultado-processo` é o **modelo inicial** herdado da T36, não uma
comunicação oficial aprovada pelo CCZ.

## Execução assíncrona

- O executor é o `applicationTaskExecutor` do Spring Boot, ligado pelo
  `@EnableAsync` de `AsyncConfig`. As threads se chamam `siszoo-async-N`. Não
  existe executor próprio para e-mail.
- No encerramento normal da aplicação, o executor espera até **20 s** pelos
  envios em curso (`spring.task.execution.shutdown`).
- A notificação de resultado já roda num listener `@Async` (`AFTER_COMMIT`) e
  chama o `enviar`, também `@Async`. Cada notificação passa, portanto, por
  duas threads do pool (`docs/decisoes/T35.md`).

## Falhas e logs

- **Sucesso:** `INFO E-mail <id> aceito pelo servidor SMTP para m***@dominio (Message-ID <...>)`,
  registrado só depois do `send` retornar.
- **Falha:** `WARN Falha no envio do e-mail <id> para m***@dominio: MailSendException <- MailConnectException <- ConnectException`.
  O aviso leva só as classes da exceção, porque a mensagem de erro do servidor
  SMTP pode repetir o endereço. O stack trace completo vai para `DEBUG`, com o
  mesmo `<id>`. Para investigar, ligue
  `logging.level.com.siszoo.comum.service.EmailService=DEBUG`; esse nível
  pode registrar o endereço.
- Nunca vão para o log: assunto, corpo, endereço completo (fora do `DEBUG`) e
  credenciais.

## Limitações

- **"Aceito pelo servidor SMTP" não quer dizer entregue.** O sucesso não
  garante que a mensagem chegou à caixa de entrada nem que foi lida. Ela ainda
  pode ser recusada depois (bounce), cair no spam ou ser descartada.
- Não há fila, retentativa nem garantia de entrega. Uma falha fica só no log.
- Os envios em andamento se perdem se o processo for morto (`kill -9`, OOM,
  `docker kill`) ou se passarem do prazo de 20 s no encerramento.
- Nada registra que o envio aconteceu, nem no processo nem em tabela própria
  (pendência da #37 em `docs/decisoes/T35.md`).
- Não há SMTPS na porta 465 (`mail.smtp.ssl.enable`). Use STARTTLS na 587 ou
  na 2525.
- Os padrões das variáveis estão duplicados entre `application.yml` e
  `docker-compose.yml`. Se mudar um, mude o outro.

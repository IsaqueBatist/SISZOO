# SPEC — Esqueleto do backend SISZOO

Registro das decisões tomadas para gerar o projeto Spring Boot inicial.
Não é documentação de arquitetura definitiva — é o log de decisões desta tarefa.

## Contexto de partida

- `backend/` não continha nenhum código (só `backend/CLAUDE.md`). Projeto criado do zero.
- `mvn` não está no PATH da máquina de desenvolvimento e não há Maven Wrapper
  (`mvnw`) no repo ainda → resolvido gerando o projeto via Spring Initializr,
  que já entrega `mvnw`/`mvnw.cmd` prontos (baixam o Maven sozinhos).
- JDK local é 25 (não 21). `javac --release 21` é suportado por um JDK 25
  (compatibilidade retroativa do compilador), então não é necessário instalar
  JDK 21 à parte — o `pom.xml` fixa `java.version=21` e o build compila para
  o bytecode/API da release 21 mesmo rodando em JDK 25.

## Versão do Spring Boot: 4.1.1 (decisão explícita do usuário)

O CLAUDE.md (raiz), `backend/CLAUDE.md` e o README pediam "Spring Boot 3.3+".
Ao consultar `start.spring.io` (2026-08-22), a linha 3.x não é mais gerável
por ele (só oferece 4.0.x/4.1.x/4.2.x); a última 3.x ainda viva no Maven
Central é `3.5.16`. Perguntado, o usuário optou por seguir com **Spring Boot
4.1.1** (última GA do Initializr), aceitando o salto de major version em vez
de fixar manualmente a última 3.x. Como consequência:

- `CLAUDE.md` (raiz) foi atualizado de "Spring Boot 3.3+" para "Spring Boot 4.1+"
  para não deixar a documentação incoerente com o código real.
- Nomes de starter mudaram nesta major (gerados pelo próprio Initializr):
  `spring-boot-starter-webmvc` (não mais `-web`), `spring-boot-starter-flyway`,
  e cada starter ganhou um artefato `-test` companion
  (`spring-boot-starter-data-jpa-test`, `-security-test`, `-validation-test`,
  `-webmvc-test`, `-flyway-test`) em vez do antigo `spring-boot-starter-test`
  monolítico.
- Boot 4.1 já usa o padrão `@ServiceConnection` (não `@DynamicPropertySource`
  manual) para plugar um Testcontainers no contexto Spring — ver seção de
  testes abaixo.

## Escopo de Security (decisão do usuário)

`SecurityFilterChain` mínima: `sessionCreationPolicy(STATELESS)`, CSRF
desabilitado, `permitAll()` em todas as rotas por enquanto (inclusive
`/api/health`). Sem `JwtAuthenticationFilter` ainda — entra quando o módulo
`usuarios`/login for implementado. Local: `com.siszoo.comum.config.SecurityConfig`
(pacote `config` não estava na lista `controller/service/repository/entity/dto/mapper`
do módulo, mas é necessário para configuração cross-cutting do Spring; criado
só dentro de `comum`).

## Mapeamento DTO: MapStruct (decisão do usuário)

`mapstruct` 1.6.3 (última estável; 1.7.0 ainda é Beta) + `mapstruct-processor`
+ `lombok-mapstruct-binding:0.2.0` para resolver a ordem dos annotation
processors com o Lombok (`lombok` deve rodar antes do `mapstruct-processor`).
Nenhum mapper concreto foi criado ainda — não há entidade/DTO real por trás
disso nesta tarefa; a dependência e a config do compilador ficam prontas para
quando a skill `nova-entidade`/`novo-endpoint` criar o primeiro par entidade/DTO.

## Testes: Testcontainers + Rest Assured

- `AbstractIntegrationTest` (`com.siszoo.comum`) usa `@SpringBootTest` com
  `webEnvironment = RANDOM_PORT` e `@Import(TestcontainersConfiguration.class)`.
  `TestcontainersConfiguration` (gerada pelo Initializr, ajustada para
  `postgres:16` em vez de `postgres:latest`, para bater com "PostgreSQL 16"
  do CLAUDE.md) expõe um `PostgreSQLContainer` como bean `@ServiceConnection`
  — o Spring injeta a URL/usuário/senha do container automaticamente no
  `DataSource` de teste, sem precisar fixar nada em `application.yml` nem
  escrever `@DynamicPropertySource` manual. Isso cumpre o requisito escolhido
  ("Testcontainers dinâmico") usando o mecanismo idiomático que o próprio
  Boot 4.1 já gera por padrão, em vez do `@DynamicPropertySource` de
  versões anteriores.
- `rest-assured` 6.0.1 (escopo test) adicionado manualmente — não existe como
  dependência do Initializr — para bater com "JUnit 5 + Testcontainers + Rest
  Assured" do CLAUDE.md.
- `HealthControllerIntegrationTest extends AbstractIntegrationTest` sobe o
  contexto completo (com Postgres real via Testcontainers) e chama
  `GET /api/health` via Rest Assured, confirmando `{"status":"UP"}`.

## application.yml (perfis dev/test)

Um único `application.yml` com documentos `---` para os perfis `dev` e
`test`, em vez de `application-dev.yml`/`application-test.yml` separados —
o `.gitignore` da raiz já tem `application-*.yml` ignorado e
`!application.yml` mantido rastreado, então essa é a convenção que o
`.gitignore` já pressupõe.

- Perfil `dev`: credenciais via `${DB_URL}`, `${DB_USER}`, `${DB_PASSWORD}`
  (nenhuma default hardcoded). `jpa.hibernate.ddl-auto: validate` — schema é
  responsabilidade do Flyway, nunca do Hibernate.
- Perfil `test`: sem `spring.datasource.*` — a URL/usuário/senha vêm do
  `@ServiceConnection` do Testcontainers em runtime.

## Flyway

`src/main/resources/db/migration/V1__baseline.sql` — baseline vazia (nenhuma
tabela ainda, nenhuma entidade existe). Convenção `V<n>__descricao.sql` do
`backend/CLAUDE.md` seguida desde a primeira migration.

## Estrutura de pacotes

`com.siszoo.{usuarios,animais,ocorrencias,processos,relatorios,comum}`, cada
um com `controller/service/repository/entity/dto/mapper`. Como só `comum`
tem conteúdo real nesta tarefa (health check + security config), os demais
módulos ganham pacotes vazios marcados com `.gitkeep` — mesma convenção que o
frontend já usa (`frontend/src/features/{animais,ocorrencias,processos}/.gitkeep`)
para pastas de feature ainda sem código, em vez de inventar uma convenção nova
(`package-info.java`) só para o backend.

## Fora de escopo desta tarefa (deliberadamente não implementado)

- `@ControllerAdvice`/exceções de negócio (409 microchip duplicado, 403
  permissão, 422 validação) citadas no `backend/CLAUDE.md`: não há nenhuma
  exceção de negócio real ainda (zero entidades), então não há o que capturar
  — criar isso agora seria código morto. Entra junto do primeiro módulo com
  regra de negócio real.
- `JwtAuthenticationFilter` / geração e validação de token: depende do módulo
  `usuarios` (login), que não existe ainda.

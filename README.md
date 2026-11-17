# SISZOO

[![CI](https://github.com/IsaqueBatist/SISZOO/actions/workflows/ci.yml/badge.svg)](https://github.com/IsaqueBatist/SISZOO/actions/workflows/ci.yml)
[![Licença: MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue.svg)](LICENSE)

Sistema web de gestão do Centro de Controle de Zoonoses (CCZ) de Itu/SP. Reúne o
cadastro e o histórico clínico dos animais do canil, o atendimento de denúncias
e o acompanhamento de processos sanitários de zoonoses, com indicadores e
relatórios. É de uso interno da equipe do CCZ; não há área pública para o cidadão.

Desenvolvido como Trabalho de Graduação do curso de Análise e Desenvolvimento de
Sistemas da FATEC Itu ([contexto acadêmico](#contexto-acadêmico)).

## Sumário

- [Contexto](#contexto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Requisitos](#requisitos)
- [Execução com Docker](#execução-com-docker)
- [Execução em modo de desenvolvimento](#execução-em-modo-de-desenvolvimento)
- [Acesso ao sistema](#acesso-ao-sistema)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Testes e verificações](#testes-e-verificações)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Documentação](#documentação)
- [Limitações conhecidas](#limitações-conhecidas)
- [Contexto acadêmico](#contexto-acadêmico)
- [Licença](#licença)

## Contexto

O CCZ de Itu registra o canil e os casos de zoonoses em fichas de papel,
etiquetas de vacina e planilhas. Os dados ficam espalhados, os reforços
vacinais dependem da memória da equipe e não há indicadores consolidados.

O SISZOO substitui esses registros por um sistema único, acessado pelo
navegador. Ele considera as condições do órgão: computadores com cerca de 2 GB
de RAM e conexão instável. Por isso o frontend carrega as telas sob demanda e os
formulários longos guardam um rascunho no navegador.

## Funcionalidades

**Animais do canil**
- Cadastro com microchip, medalha, procedência e foto; baias com controle de ocupação.
- Histórico clínico de vacinações, procedimentos, prescrições e exames. Os
  registros não são editados nem apagados: uma correção gera um novo registro
  que retifica o anterior.
- Anexos (imagens e PDF), catálogos de vacinas e medicamentos e alertas de
  reforço vacinal com 7 dias de antecedência.

**Ocorrências e denúncias**
- Registro com protocolo anual (`NNN/AAAA`), denunciante identificado, sigiloso
  ou anônimo, anexos, notas e encerramento com a providência tomada.
- Em ocorrências sigilosas, os dados do denunciante são mascarados no servidor
  para quem não tem permissão, e cada acesso é registrado na auditoria.

**Processos sanitários**
- Raiva, esporotricose, leishmaniose visceral, leptospirose, febre maculosa e
  febre amarela, com amostras, resultado laboratorial e acompanhamento por status.
- Processos com contato humano-animal são marcados como urgentes.
- Resultado positivo ou inconclusivo envia notificação por e-mail ao munícipe.

**Dashboard e relatórios**
- Indicadores e gráficos do ano.
- Seis relatórios em PDF e CSV (vacinação, procedimentos, adoções, ocupação de
  baias, ocorrências por bairro e anual de processos), com histórico de exportações.

**Acesso e auditoria**
- Login com sessão renovável, expiração por inatividade e limite de tentativas.
- Troca obrigatória da senha no primeiro acesso e recuperação de senha por e-mail.
- Três perfis com permissões fixas e trilha de auditoria consultável.

| Perfil | Acesso |
|---|---|
| Administrador | Todos os módulos, incluindo usuários, auditoria e dados de denunciante sigiloso |
| Veterinário | Animais, baias, histórico clínico, processos sanitários e relatórios; não acessa ocorrências |
| Agente Sanitário | Ocorrências (incluindo denunciante sigiloso), processos sanitários, consulta de animais e relatórios |

As regras de negócio completas estão em [docs/DER.md](docs/DER.md).

## Tecnologias

| Camada | Tecnologias |
|---|---|
| Backend | Java 21, Spring Boot 4 (Web MVC, Security, Data JPA, Validation, Mail, Cache), Flyway, MapStruct, Lombok |
| Relatórios e e-mail | Thymeleaf e Flying Saucer (geração de PDF) |
| Frontend | React 19, TypeScript, Vite, TanStack Query, React Router, React Hook Form, Zod, Recharts |
| Banco de dados | PostgreSQL 16 |
| Autenticação | JWT de curta duração e sessão renovável em cookie httpOnly |
| Testes | JUnit 5, Mockito, Testcontainers, REST Assured e GreenMail no backend; Vitest, Testing Library e MSW no frontend |
| Infraestrutura | Docker, Docker Compose e GitHub Actions |

## Requisitos

| Ferramenta | Versão | Quando é necessária |
|---|---|---|
| [Git](https://git-scm.com/) | recente | Sempre |
| [Docker](https://docs.docker.com/get-docker/) com Compose v2 | recente | Execução com Docker, banco no modo de desenvolvimento e testes de integração |
| [Java (JDK)](https://adoptium.net/) | 21 | Backend no modo de desenvolvimento |
| [Node.js](https://nodejs.org/) | 22.22.2 ou superior na 22, 24.15 ou superior na 24, ou 26+ | Frontend no modo de desenvolvimento |
| [PostgreSQL](https://www.postgresql.org/download/) | 16 | Só se não for usar o banco do Docker |

O Maven não precisa ser instalado, porque o projeto inclui o Maven Wrapper
(`mvnw` e `mvnw.cmd`). Para conferir as versões instaladas:

```bash
git --version
docker compose version
java -version
node -v
```

Comece clonando o repositório:

```bash
git clone https://github.com/IsaqueBatist/SISZOO.git
cd SISZOO
```

## Execução com Docker

Sobe banco, backend e frontend em containers. Só exige o Docker.

1. Crie o arquivo `.env` a partir do exemplo:

   ```bash
   cp .env.example .env
   ```

   No PowerShell: `Copy-Item .env.example .env`.

2. Gere uma chave para o JWT e substitua `troque-por-uma-chave-gerada` em
   `JWT_SECRET`, no `.env`. A chave precisa ter pelo menos 32 bytes; com o
   valor do exemplo, o backend não inicia.

   ```bash
   openssl rand -base64 48
   ```

   No PowerShell, sem `openssl`:

   ```powershell
   $b = New-Object byte[] 48; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
   ```

3. Suba os serviços:

   ```bash
   docker compose up --build
   ```

   O primeiro build baixa as dependências e leva alguns minutos. O sistema fica
   disponível quando o backend registrar `Started SiszooBackendApplication`.

4. Acesse http://localhost:5173 (veja [Acesso ao sistema](#acesso-ao-sistema)).

Para parar, use `docker compose down`; para apagar também os dados do banco,
`docker compose down -v`.

### Com dados fictícios

Para explorar o sistema já preenchido, use o arquivo de override de
desenvolvimento. Ele não precisa de `.env`, porque traz chave JWT e
administrador próprios para uso local:

```bash
docker compose -f docker-compose.yml -f docker-compose.seed.yml up --build
```

O seed roda depois que o backend inicia. Os dados e os usuários ficam
disponíveis quando o log mostrar `Seed de dados ficticios concluido`.

Esse ambiente usa containers e volume próprios (projeto `siszoo-seed`), mas as
mesmas portas: pare um ambiente antes de subir o outro. **Não use o
`docker-compose.seed.yml` em servidor.** Os usuários criados estão em
[Dados fictícios](#dados-fictícios).

## Execução em modo de desenvolvimento

Backend e frontend rodam direto na máquina, com recarga automática.

### 1. Banco de dados

A forma mais simples é usar só o container do banco:

```bash
docker compose up -d db
```

Ele cria o database `siszoo` (usuário `postgres`, senha `postgres`) na porta 5432.

Para usar um PostgreSQL 16 instalado na máquina, crie um usuário e um database
vazios com o `psql`, conectado como superusuário:

```sql
CREATE USER siszoo WITH PASSWORD 'siszoo';
CREATE DATABASE siszoo OWNER siszoo;
```

O schema não é criado à mão: na primeira subida do backend, o Flyway aplica as
migrations de `backend/src/main/resources/db/migration`. Não é preciso instalar
extensões.

### 2. Backend

Em um terminal, defina as variáveis e inicie o backend (porta 8080):

```bash
cd backend
export DB_URL=jdbc:postgresql://localhost:5432/siszoo
export DB_USER=postgres
export DB_PASSWORD=postgres
export JWT_SECRET="$(openssl rand -base64 48)"
export ADMIN_SEED_EMAIL=admin.sistema@itu.sp.gov.br
export ADMIN_SEED_PASSWORD=Ccz-Dev-Itu-2026
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Com o PostgreSQL instalado na máquina, use `DB_USER=siszoo` e
`DB_PASSWORD=siszoo` (ou os valores que você definiu).

No PowerShell:

```powershell
cd backend
$env:DB_URL = "jdbc:postgresql://localhost:5432/siszoo"
$env:DB_USER = "postgres"
$env:DB_PASSWORD = "postgres"
$b = New-Object byte[] 48; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
$env:JWT_SECRET = [Convert]::ToBase64String($b)
$env:ADMIN_SEED_EMAIL = "admin.sistema@itu.sp.gov.br"
$env:ADMIN_SEED_PASSWORD = "Ccz-Dev-Itu-2026"
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
```

O backend está pronto quando o log mostrar `Started SiszooBackendApplication`.
Para conferir: http://localhost:8080/api/health deve responder `{"status":"UP"}`.

### 3. Frontend

Em outro terminal, a partir da raiz do repositório:

```bash
cd frontend
npm install
npm run dev
```

O frontend sobe em http://localhost:5173 e usa a API em `http://localhost:8080`.
Para apontar para outra API, copie `frontend/.env.example` para `frontend/.env` e
ajuste `VITE_API_BASE_URL`.

## Acesso ao sistema

Abra http://localhost:5173 e entre com o administrador definido em
`ADMIN_SEED_EMAIL` e `ADMIN_SEED_PASSWORD`. Com os valores do exemplo:

- e-mail: `admin.sistema@itu.sp.gov.br`
- senha: `Ccz-Dev-Itu-2026`

No primeiro acesso o sistema pede uma nova senha antes de liberar as telas.
Depois disso, cadastre os demais usuários em **Usuários**; cada um também troca a
senha temporária no primeiro login.

O administrador é criado uma única vez, quando ainda não existe. Para recomeçar
com o banco vazio, use `docker compose down -v` (Docker) ou recrie o database.

### Dados fictícios

No ambiente com dados fictícios, todos os usuários usam a senha **`Ficticio#2026`**:

| Perfil | E-mail |
|---|---|
| Administrador | `marta.siqueira.seed@itu.sp.gov.br` |
| Veterinário | `renato.albuquerque.seed@itu.sp.gov.br`, `camila.prado.seed@itu.sp.gov.br` |
| Veterinário (ainda no primeiro acesso) | `helena.duarte.seed@itu.sp.gov.br` |
| Agente Sanitário | `paulo.teixeira.seed@itu.sp.gov.br`, `juliana.moreira.seed@itu.sp.gov.br`, `rafael.campos.seed@itu.sp.gov.br` |
| Agente Sanitário (desativado) | `sergio.lacerda.seed@itu.sp.gov.br` |

O seed cria 9 baias, 50 animais com foto e histórico clínico, 36 ocorrências,
29 processos sanitários, medicamentos e uma exportação de cada relatório. Ele
chama os mesmos serviços da API, então segue as regras reais do sistema.

Os animais cobrem as quatro espécies do catálogo (caninos, felinos, quirópteros e
primatas) e os cenários-limite das regras de negócio: esterilização nos três
estados, entrada dos dois lados do prazo de 72 horas, vacinas vencendo e
vencidas, condições de saúde, transferências nos quatro tipos de destino e
ocorrências com animal recolhido. Os detalhes estão em
[docs/decisoes/seed-dev.md](docs/decisoes/seed-dev.md).

Para gerar os dados fictícios no modo de desenvolvimento, use um database vazio
separado do principal e acrescente o perfil `seed`:

```bash
docker compose up -d db
docker compose exec db createdb -U postgres siszoo_seed
cd backend
export DB_URL=jdbc:postgresql://localhost:5432/siszoo_seed DB_USER=postgres DB_PASSWORD=postgres
export JWT_SECRET="$(openssl rand -base64 48)"
export ADMIN_SEED_EMAIL=admin.sistema@itu.sp.gov.br ADMIN_SEED_PASSWORD=Ccz-Dev-Itu-2026
export SISZOO_SEED_HABILITADO=true
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev,seed
```

Espere pelo log `Seed de dados ficticios concluido` antes de entrar no sistema.
O seed pode ser executado de novo: o que já existe é pulado. Ele só roda com o
perfil `seed` e `SISZOO_SEED_HABILITADO=true`, recusa os perfis `docker` e `prod`
e recusa bancos com dados que não vieram dele. Detalhes em
[docs/decisoes/seed-dev.md](docs/decisoes/seed-dev.md).

## Variáveis de ambiente

O Docker Compose lê o `.env` da raiz ([`.env.example`](.env.example)). No modo de
desenvolvimento, as variáveis do backend são definidas no terminal, e o frontend
lê `frontend/.env` ([`frontend/.env.example`](frontend/.env.example)).

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | sim | Conexão JDBC com o PostgreSQL |
| `JWT_SECRET` | sim | Chave de assinatura do JWT, com 32 bytes ou mais |
| `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` | não | Administrador criado na subida, se ainda não existir; vazias, nenhum é criado. O e-mail precisa ter só letras minúsculas e pontos antes de `@itu.sp.gov.br`, senão o backend não inicia |
| `SISZOO_CORS_ORIGIN` | não | Origem do frontend aceita pela API; padrão `http://localhost:5173` |
| `SISZOO_APP_URL` | não | Endereço do frontend nos links enviados por e-mail; padrão igual a `SISZOO_CORS_ORIGIN` |
| `SISZOO_COOKIE_SECURE`, `SISZOO_COOKIE_SAMESITE` | não | Cookie de sessão; em produção com HTTPS, use `SISZOO_COOKIE_SECURE=true` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_AUTH`, `SMTP_STARTTLS`, `SMTP_STARTTLS_REQUIRED`, `SMTP_SSL` | não | Servidor de e-mail. Sem ele, o sistema funciona e cada envio só gera um aviso no log |
| `SISZOO_MAIL_FROM` | não | Remetente dos e-mails |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | não | Banco criado pelo container `db` do Docker Compose |
| `VITE_API_BASE_URL` | não | Endereço da API usado no build do frontend; padrão `http://localhost:8080` |
| `VITE_USE_MOCK_KPIS`, `VITE_USE_MOCK_GRAFICOS` | não | Só o valor `true` mostra dados de demonstração no dashboard, sempre identificados |

Os valores do `.env.example` são para uso local. Em qualquer outro ambiente,
troque todas as senhas e a chave JWT. Para testar e-mails, use um SMTP sandbox
(Mailtrap ou Ethereal), nunca uma caixa real; veja [docs/email.md](docs/email.md).

## Testes e verificações

Backend, a partir de `backend/` (no Windows, `.\mvnw.cmd` no lugar de `./mvnw`):

```bash
./mvnw test     # testes unitários
./mvnw verify   # testes unitários e de integração
```

Os testes de integração usam um PostgreSQL real criado pelo Testcontainers, por
isso exigem o Docker em execução.

Frontend, a partir de `frontend/`:

```bash
npm run lint    # análise estática (oxlint)
npm run test    # testes de componentes e hooks (Vitest)
npm run build   # checagem de tipos e build de produção
```

O [CI](.github/workflows/ci.yml) roda esses comandos a cada push e pull request
na `main`. Depois de um push na `main` com o CI aprovado, o workflow
[Deploy](.github/workflows/deploy.yml) publica as imagens no GitHub Container
Registry, e o servidor se atualiza sozinho ([docs/deploy.md](docs/deploy.md)). Para testes manuais da API, há uma coleção do Insomnia em `.insomnia/`
([como usar](docs/insomnia/README.md)) e um
[roteiro de testes manuais](docs/roteiro-testes-manuais.md).

## Estrutura do repositório

```
SISZOO/
├── backend/                  API REST (Spring Boot)
│   └── src/main/
│       ├── java/com/siszoo/  um pacote por módulo: animais, ocorrencias, processos, relatorios, usuarios...
│       └── resources/
│           ├── db/migration/ migrations Flyway (schema do banco)
│           └── templates/    modelos de e-mail e dos relatórios em PDF
├── frontend/                 aplicação web (React)
│   └── src/features/         uma pasta por módulo, com telas, chamadas à API e testes
├── docs/                     modelo de dados, decisões, contratos de API e protótipo
├── .insomnia/                coleção do Insomnia para testar a API
├── .github/workflows/        CI e publicação das imagens (deploy)
├── deploy/                   Caddyfile e script de atualização do servidor
├── docker-compose.yml        banco, backend e frontend
├── docker-compose.seed.yml   override de desenvolvimento com dados fictícios
├── docker-compose.deploy.yml servidor: imagens publicadas, banco externo e HTTPS
└── .env.example              variáveis de ambiente do Docker Compose
```

## Documentação

| Documento | Conteúdo |
|---|---|
| [docs/README.md](docs/README.md) | Índice da documentação e orientações de manutenção |
| [docs/DER.md](docs/DER.md) | Modelo de dados e regras de negócio numeradas |
| [docs/decisoes/](docs/decisoes/) | Decisões de projeto, por tema |
| [docs/contratos/](docs/contratos/) | Contratos de endpoints entre frontend e backend |
| [docs/integracao-frontend-api.md](docs/integracao-frontend-api.md) | Relação entre telas, chamadas, endpoints e tabelas |
| [docs/regras-negocio-clinico.md](docs/regras-negocio-clinico.md) | Regras de vacinação, procedimentos, prescrições, exames e alertas |
| [docs/email.md](docs/email.md) | Configuração de SMTP, modelos e notificações |
| [docs/deploy.md](docs/deploy.md) | Publicação em servidor e atualização automática a partir da `main` |
| [docs/insomnia/README.md](docs/insomnia/README.md) | Uso da coleção do Insomnia |
| [docs/roteiro-testes-manuais.md](docs/roteiro-testes-manuais.md) | Roteiro de testes manuais por área |
| [docs/prototipo/](docs/prototipo/) | Protótipo navegável e design system |

## Limitações conhecidas

- O dashboard e o relatório de adoções mostram a posição na data da consulta; não
  há contagem de adoções por mês, porque a tabela `adocao` do modelo de dados
  ainda não foi implementada.
- O relatório de ocupação de baias mostra a posição na data da geração, sem
  histórico diário.
- Não há busca global; cada listagem tem os próprios filtros.
- Vacinas e medicamentos têm tela de cadastro. Os demais catálogos (tipos de
  procedimento e de exame, doenças, laboratórios) vêm das migrations.
- Nos dados fictícios, o tempo médio de atendimento do relatório de ocorrências
  por bairro fica perto de zero, porque o seed registra e encerra cada ocorrência
  no mesmo momento.

## Contexto acadêmico

O SISZOO é o Trabalho de Graduação de Beatriz Silva de Camargo e Isaque Batista
Barbosa no curso de Análise e Desenvolvimento de Sistemas da FATEC Itu (2026),
com orientação do Prof. Me. Francisco Bianchi. Os requisitos foram levantados
com a equipe do CCZ de Itu. O material do trabalho (análises, capturas de tela e
diagramas) está em [docs/tg/](docs/tg/README.md).

## Licença

Distribuído sob a licença [MIT](LICENSE).

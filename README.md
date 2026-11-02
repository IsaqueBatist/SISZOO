# SISZOO

[![CI](https://github.com/IsaqueBatist/SISZOO/actions/workflows/ci.yml/badge.svg)](https://github.com/IsaqueBatist/SISZOO/actions/workflows/ci.yml)
[![Licença: MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue.svg)](LICENSE)

**Sistema de Gerenciamento do Centro de Controle de Zoonoses (CCZ) de Itu/SP.**

O SISZOO é um sistema web de uso interno que substitui as fichas de papel, as etiquetas de vacina e as planilhas usadas
hoje pela equipe do CCZ no canil, no atendimento de denúncias e no acompanhamento de processos sanitários.

> Trabalho de Graduação do curso de Análise e Desenvolvimento de Sistemas da **FATEC Itu** (2026).
> Autores: Beatriz Silva de Camargo e Isaque Batista Barbosa. Orientador: Prof. Me. Francisco Bianchi.

## Sumário

- [Visão geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Perfis de acesso](#perfis-de-acesso)
- [Regras de negócio essenciais](#regras-de-negócio-essenciais)
- [Arquitetura e tecnologias](#arquitetura-e-tecnologias)
- [Como executar](#como-executar)
  - [Pré-requisitos](#pré-requisitos)
  - [Opção 1: Docker Compose](#opção-1-docker-compose)
  - [Opção 2: Docker Compose com dados fictícios](#opção-2-docker-compose-com-dados-fictícios)
  - [Opção 3: Desenvolvimento local](#opção-3-desenvolvimento-local)
- [Testes e qualidade](#testes-e-qualidade)
- [Configuração](#configuração)
- [Dados fictícios](#dados-fictícios)
- [Documentação](#documentação)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Limitações conhecidas](#limitações-conhecidas)
- [Licença](#licença)

## Visão geral

O CCZ de Itu controla o canil e os casos de zoonoses com registros manuais. Isso fragmenta os dados, deixa os reforços
vacinais dependentes da memória da equipe e impede a geração de indicadores.

O SISZOO centraliza esses registros num sistema leve, acessado pelo navegador e restrito aos funcionários do CCZ (não
há portal público para o cidadão). Ele foi projetado para as condições reais do órgão:

- computadores com cerca de **2 GB de RAM**, por isso o frontend carrega sob demanda e o backend evita processamento
  desnecessário;
- **internet instável**, por isso os formulários longos guardam rascunho no navegador e retomam o envio depois de uma
  queda;
- acesso **somente pelo navegador** (Chrome, Edge ou Firefox).

## Funcionalidades

| Módulo | O que oferece |
|---|---|
| **Animais do canil** | Cadastro com microchip, medalha e procedência; gestão de baias com ocupação; histórico clínico (vacinações, procedimentos, prescrições e exames); anexos; alertas de reforço vacinal; catálogos de vacinas e medicamentos |
| **Ocorrências e denúncias** | Protocolo anual, denunciante sigiloso ou anônimo, anexos, movimentações e encerramento com providência |
| **Processos sanitários** | Raiva, esporotricose, leishmaniose visceral, leptospirose, febre maculosa e febre amarela: amostras, resultado laboratorial e notificação ao munícipe por e-mail |
| **Dashboard e relatórios** | Indicadores e gráficos; seis relatórios em PDF e CSV com histórico de exportações |
| **Acesso e auditoria** | Login com sessão renovável, expiração por inatividade e limite de tentativas; recuperação de senha por e-mail; perfis com permissões fixas; trilha de auditoria consultável |

## Perfis de acesso

| Perfil | Pode |
|---|---|
| **Administrador** | Tudo: usuários, trilha de auditoria, animais, ocorrências (inclusive dados de denunciante sigiloso), processos e relatórios |
| **Veterinário** | Animais, baias e histórico clínico; processos sanitários; relatórios. Não acessa ocorrências |
| **Agente Sanitário** | Ocorrências e denúncias (inclusive dados de denunciante sigiloso); processos sanitários; consulta de animais; relatórios |

## Regras de negócio essenciais

- **Microchip e medalha** identificam o animal de forma única quando informados; o microchip não muda depois de definido.
- **Protocolos** de ocorrência e de processo seguem o formato `NNN/AAAA`, sequencial por ano, gerados pelo sistema.
- **Registros clínicos e resultados laboratoriais são imutáveis:** a correção é um novo registro que retifica o anterior,
  com auditoria. O resultado positivo é definitivo.
- **Contato humano-animal** torna o processo urgente, e ele aparece no topo das listagens.
- **Resultado positivo ou inconclusivo** dispara a notificação por e-mail ao munícipe, com reenvio manual se o envio falhar.
- **Reforço vacinal** é sinalizado com 7 dias de antecedência.
- **Óbito por eutanásia** exige laudo.
- **Ocorrências sigilosas** têm os dados do denunciante mascarados no servidor para quem não tem permissão; cada acesso
  e cada recusa ficam na auditoria (LGPD).

O conjunto completo de regras, numeradas, está em [docs/DER.md](docs/DER.md).

## Arquitetura e tecnologias

```
Navegador ──► Frontend (React, SPA) ──HTTP/JSON──► Backend (Spring Boot, API REST) ──JDBC──► PostgreSQL
                 servido por nginx                    JWT + cookie de sessão                 migrations Flyway
```

| Camada | Tecnologias |
|---|---|
| Backend | Java 21, Spring Boot 4 (Web MVC, Security, Data JPA, Validation, Mail, Cache), Flyway, MapStruct, Lombok, Thymeleaf e Flying Saucer (PDF) |
| Frontend | React 19, TypeScript, Vite, TanStack Query, React Router, React Hook Form e Zod, Recharts, IndexedDB (rascunhos) |
| Banco de dados | PostgreSQL 16, com o schema versionado em migrations Flyway (`backend/src/main/resources/db/migration`) |
| Autenticação | JWT de curta duração e sessão renovável em cookie httpOnly ([decisões](docs/decisoes/sessao.md)) |
| Testes | JUnit 5, Mockito, Testcontainers, REST Assured, GreenMail; Vitest, Testing Library e MSW |
| Infraestrutura | Docker e Docker Compose; GitHub Actions para lint, testes e build a cada push e pull request |

## Como executar

### Pré-requisitos

| Ferramenta | Versão | Necessária para |
|---|---|---|
| [Git](https://git-scm.com/) | qualquer recente | Clonar o repositório |
| [Docker](https://docs.docker.com/get-docker/) com Compose v2 | Docker Desktop ou Engine recente | Opções 1 e 2; testes de integração do backend |
| [Java](https://adoptium.net/) | 21 | Opção 3 (backend local) |
| [Node.js](https://nodejs.org/) | 22.22.2+, 24.15+ ou 26+ (o CI usa a 24) | Opção 3 (frontend local) |

O Maven não precisa ser instalado: o projeto traz o Maven Wrapper (`mvnw`). O PostgreSQL também não, porque todas as
opções usam o banco do Docker Compose.

```bash
git clone https://github.com/IsaqueBatist/SISZOO.git
cd SISZOO
```

### Opção 1: Docker Compose

Sobe banco, backend e frontend com um comando. É o caminho mais curto para ver o sistema funcionando.

**1. Crie o arquivo de configuração** a partir do exemplo:

```bash
cp .env.example .env
```

**2. Gere uma chave JWT** e cole no lugar de `troque-por-uma-chave-gerada`, em `JWT_SECRET`. Ela precisa ter 32 bytes
ou mais; o valor do exemplo é curto de propósito, e o backend não sobe com ele.

```bash
openssl rand -base64 48
```

No Windows sem `openssl`, use o PowerShell:

```powershell
$b = New-Object byte[] 48; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
```

**3. Suba os serviços:**

```bash
docker compose up --build
```

| Serviço | Endereço |
|---|---|
| Aplicação | http://localhost:5173 |
| API | http://localhost:8080/api (verificação: http://localhost:8080/api/health) |
| PostgreSQL | `localhost:5432` |

**4. Entre no sistema** com o administrador inicial definido em `ADMIN_SEED_EMAIL` e `ADMIN_SEED_PASSWORD` no `.env`
(por padrão, `admin.sistema@itu.sp.gov.br` / `Ccz-Dev-Itu-2026`). No primeiro acesso o sistema exige a troca da senha;
depois, cadastre os demais usuários em **Usuários**.

Para parar, use `docker compose down`. Para apagar também o banco, `docker compose down -v`.

> Os valores do `.env.example` servem para desenvolvimento local. Em qualquer outro ambiente, troque todas as senhas e
> a chave JWT, use HTTPS e defina `SISZOO_COOKIE_SECURE=true`.

### Opção 2: Docker Compose com dados fictícios

O mesmo ambiente da opção 1, já preenchido com animais, ocorrências, processos e usuários fictícios para explorar todas
as telas. Não precisa de `.env`: o override traz chave JWT e administrador próprios para uso local.

```bash
docker compose -f docker-compose.yml -f docker-compose.seed.yml up --build
```

Os usuários e o que é criado estão em [Dados fictícios](#dados-fictícios). Os dois ambientes usam as mesmas portas:
pare um antes de subir o outro. **Nunca use o `docker-compose.seed.yml` num servidor.**

### Opção 3: Desenvolvimento local

Backend e frontend rodando direto na máquina, com recarga automática, e o banco no Docker.

**1. Banco de dados:**

```bash
docker compose up -d db
```

**2. Backend** (em `http://localhost:8080`), em um terminal:

```bash
cd backend
export DB_URL=jdbc:postgresql://localhost:5432/siszoo DB_USER=postgres DB_PASSWORD=postgres
export JWT_SECRET="$(openssl rand -base64 48)"
export ADMIN_SEED_EMAIL=admin.sistema@itu.sp.gov.br ADMIN_SEED_PASSWORD=Ccz-Dev-Itu-2026
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

<details>
<summary>No PowerShell</summary>

```powershell
cd backend
$env:DB_URL = "jdbc:postgresql://localhost:5432/siszoo"; $env:DB_USER = "postgres"; $env:DB_PASSWORD = "postgres"
$b = New-Object byte[] 48; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
$env:JWT_SECRET = [Convert]::ToBase64String($b)
$env:ADMIN_SEED_EMAIL = "admin.sistema@itu.sp.gov.br"; $env:ADMIN_SEED_PASSWORD = "Ccz-Dev-Itu-2026"
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
```

</details>

As migrations rodam na subida e criam o schema num banco vazio. O administrador só é criado se ainda não existir.

**3. Frontend** (em `http://localhost:5173`), em outro terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

O `.env` do frontend aponta para a API em `http://localhost:8080`.

**E-mail (opcional):** a notificação ao munícipe e o link de recuperação de senha saem pelo SMTP configurado em
`SMTP_*`. Sem ele, o sistema funciona normalmente e cada envio só gera um aviso no log. No desenvolvimento, use um SMTP
sandbox (Mailtrap ou Ethereal), nunca uma caixa real; veja [docs/email.md](docs/email.md).

## Testes e qualidade

| Onde | Comando | O que roda |
|---|---|---|
| `backend/` | `./mvnw verify` | Testes unitários e de integração. Os de integração usam PostgreSQL real via Testcontainers, por isso exigem o Docker em execução |
| `backend/` | `./mvnw test` | Só os testes unitários, sem Docker |
| `frontend/` | `npm run lint` | Análise estática (oxlint) |
| `frontend/` | `npm run test` | Testes de componentes e hooks (Vitest, Testing Library e MSW) |
| `frontend/` | `npm run build` | Checagem de tipos (`tsc -b`) e build de produção |

No Windows, use `.\mvnw.cmd` no lugar de `./mvnw`. O [CI](.github/workflows/ci.yml) executa esses mesmos comandos a
cada push e pull request na `main`. Para testar a API manualmente, há uma coleção do Insomnia em `.insomnia/`
([como usar](docs/insomnia/README.md)) e um [roteiro de testes manuais](docs/roteiro-testes-manuais.md).

## Configuração

O Docker Compose lê o `.env` da raiz ([`.env.example`](.env.example)); o frontend em desenvolvimento lê
`frontend/.env` ([`frontend/.env.example`](frontend/.env.example)).

| Variável | Usada por | Descrição |
|---|---|---|
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Docker Compose | Banco do container `db` |
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | backend | Conexão JDBC com o PostgreSQL |
| `JWT_SECRET` | backend | **Obrigatória.** Chave do JWT, com 32 bytes ou mais; sem ela o backend não sobe |
| `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` | backend | Administrador criado na subida, se ainda não existir; vazio = não cria. A senha precisa ser trocada no primeiro acesso |
| `SISZOO_CORS_ORIGIN` | backend | Única origem do frontend aceita pela API (padrão `http://localhost:5173`) |
| `SISZOO_APP_URL` | backend | Endereço do frontend usado nos links enviados por e-mail; padrão = `SISZOO_CORS_ORIGIN` |
| `SISZOO_COOKIE_SECURE`, `SISZOO_COOKIE_SAMESITE` | backend | Cookie da sessão; em produção com HTTPS, `SISZOO_COOKIE_SECURE=true` ([decisões](docs/decisoes/sessao.md)) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_AUTH`, `SMTP_STARTTLS`, `SMTP_STARTTLS_REQUIRED`, `SMTP_SSL` | backend | Servidor de e-mail ([docs/email.md](docs/email.md)) |
| `SISZOO_MAIL_FROM` | backend | Remetente dos e-mails |
| `SISZOO_SEED_HABILITADO` | backend | `true` liga o seed de dados fictícios (só com os perfis `dev,seed`) |
| `VITE_API_BASE_URL` | frontend (build) | Endereço da API |
| `VITE_USE_MOCK_KPIS`, `VITE_USE_MOCK_GRAFICOS` | frontend (build) | Só o valor `true` liga dados de demonstração no dashboard, sempre com selo; ausente = dados reais |

Os perfis do backend são `dev` (desenvolvimento local), `docker` e `prod` (mesma configuração, usados no container) e
`seed` (dados fictícios, somente junto com `dev`).

## Dados fictícios

O seed (`com.siszoo.seed`) preenche o banco chamando os mesmos services da API. Por isso protocolos, ficha completa,
sigilo e auditoria seguem as regras reais. Decisões e detalhes: [docs/decisoes/seed-dev.md](docs/decisoes/seed-dev.md).

**Usuários** (todos fictícios, senha **`Ficticio#2026`**):

| Perfil | E-mail |
|---|---|
| Administrador | `marta.siqueira.seed@itu.sp.gov.br` |
| Veterinário | `renato.albuquerque.seed@itu.sp.gov.br`, `camila.prado.seed@itu.sp.gov.br` |
| Veterinário (primeiro acesso: o login pede a troca de senha) | `helena.duarte.seed@itu.sp.gov.br` |
| Agente Sanitário | `paulo.teixeira.seed@itu.sp.gov.br`, `juliana.moreira.seed@itu.sp.gov.br`, `rafael.campos.seed@itu.sp.gov.br` |
| Agente Sanitário (desativado) | `sergio.lacerda.seed@itu.sp.gov.br` |

**O que é criado:** 6 baias; 32 animais com foto (fotografias CC0 do Wikimedia Commons, créditos em
`backend/src/main/resources/seed/fotos/CREDITOS.md`) e histórico clínico com vacinas vencendo e vencidas, procedimentos,
prescrições, exames, anexos e retificações; 26 ocorrências em todos os status, inclusive sigilosas e anônimas;
24 processos sanitários com todos os status e doenças; categorias e medicamentos; uma exportação de cada relatório.
É o suficiente para exercitar paginação, filtros, os alertas e os gráficos do dashboard.

**Seed sem Docker para o backend.** Use um database vazio, separado do principal:

```bash
docker compose up -d db
docker exec siszoo-db-1 createdb -U postgres siszoo_seed
cd backend
export DB_URL=jdbc:postgresql://localhost:5432/siszoo_seed DB_USER=postgres DB_PASSWORD=postgres
export JWT_SECRET="$(openssl rand -base64 48)"
export ADMIN_SEED_EMAIL=admin.sistema@itu.sp.gov.br ADMIN_SEED_PASSWORD=Ccz-Dev-Itu-2026
SISZOO_SEED_HABILITADO=true ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev,seed
```

No PowerShell, defina as variáveis com `$env:` (como na opção 3), inclusive `$env:SISZOO_SEED_HABILITADO = "true"`, e
rode `.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev,seed"`.

**Como funciona:**

- **Idempotente:** cada passo tem uma chave em `seed_controle`; subir de novo pula o que já existe, sem duplicar nem
  alterar dados. Para recomeçar, recrie o database (`dropdb` e `createdb`) ou use `down -v` no Docker. O seed nunca
  apaga tabelas, porque registros clínicos, processos e auditoria são protegidos contra exclusão por triggers.
- **Restrito ao desenvolvimento:** só roda com o perfil `seed` **e** `SISZOO_SEED_HABILITADO=true`; o perfil `seed`
  exige `dev` ou `test` e derruba a subida com `docker` ou `prod`; num banco com dados que não vieram dele, recusa antes
  de gravar qualquer coisa.
- **Datas relativas:** as datas de negócio são calculadas a partir do dia da primeira execução e ficam fixas. Depois de
  alguns dias, vacinas "vencendo" passam a "vencidas"; recrie o database para renovar.

> **LGPD:** nunca versione dados reais de munícipes, denunciantes ou animais. O seed usa apenas dados fictícios: CPF
> vazio, telefones inválidos de propósito e e-mails no domínio reservado `exemplo.test`.

## Documentação

| Documento | Conteúdo |
|---|---|
| [docs/README.md](docs/README.md) | Índice de toda a documentação e como mantê-la |
| [docs/DER.md](docs/DER.md) | Modelo de dados, regras de negócio numeradas e estado do schema por migration |
| [docs/decisoes/](docs/decisoes/) | Registro das decisões de projeto, por tema |
| [docs/contratos/](docs/contratos/) | Contratos de endpoints combinados entre frontend e backend |
| [docs/integracao-frontend-api.md](docs/integracao-frontend-api.md) | Matriz tela → serviço → endpoint → tabela |
| [docs/regras-negocio-clinico.md](docs/regras-negocio-clinico.md) | Regras de vacinação, procedimentos, prescrições, exames e alertas |
| [docs/email.md](docs/email.md) | Configuração de SMTP, templates e notificações |
| [docs/roteiro-testes-manuais.md](docs/roteiro-testes-manuais.md) | Roteiro de teste manual por área |
| [docs/prototipo/](docs/prototipo/) | Protótipo navegável e design system que deram origem às telas |
| [docs/tg/README.md](docs/tg/README.md) | Material do Trabalho de Graduação |

## Estrutura do repositório

```
SISZOO/
├── .github/workflows/      # CI: lint, testes e build do backend e do frontend
├── .insomnia/              # Coleção do Insomnia com requisições e testes da API
├── backend/                # API REST (Spring Boot, Java 21, Maven)
│   └── src/main/resources/
│       ├── db/migration/   # Migrations Flyway (schema do banco)
│       ├── templates/      # Modelos de e-mail e dos relatórios em PDF
│       └── seed/           # Fotos do seed de dados fictícios
├── frontend/               # Aplicação web (React, TypeScript, Vite)
├── docs/                   # Modelo de dados, decisões, contratos, protótipo e material do TG
├── docker-compose.yml      # Banco, backend e frontend
├── docker-compose.seed.yml # Override de desenvolvimento com dados fictícios
├── .env.example            # Variáveis de ambiente do Docker Compose
└── LICENSE
```

## Limitações conhecidas

- **Adoções:** o dashboard e o relatório mostram a posição na data da consulta (adotados e disponíveis). Não há
  "adoções no mês" nem meta mensal, porque a tabela `adocao` do modelo ainda não foi implementada.
- **Ocupação de baias:** o relatório mostra a posição na data da geração; não há histórico diário.
- **Busca global:** não existe; cada listagem tem os próprios filtros.
- **Catálogos:** vacinas e medicamentos têm tela de cadastro. Tipos de procedimento e de exame, doenças, laboratórios e
  os demais catálogos vêm das migrations e não têm tela.
- **Seed:** no relatório Ocorrências por Bairro, o "Tempo médio (h)" das ocorrências encerradas pelo seed fica perto de
  0 h, porque registro e encerramento são gravados no mesmo momento.

## Licença

Distribuído sob a licença [MIT](LICENSE).

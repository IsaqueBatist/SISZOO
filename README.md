# SISZOO — Sistema de Gestão do CCZ de Itu

[![CI](https://github.com/IsaqueBatist/SISZOO/actions/workflows/ci.yml/badge.svg)](https://github.com/IsaqueBatist/SISZOO/actions/workflows/ci.yml)

Sistema web interno para o **Centro de Controle de Zoonoses (CCZ) de Itu/SP**. Centraliza a rotina do canil, as
ocorrências e denúncias e os processos sanitários de zoonoses, hoje controlados em fichas de papel e planilhas Excel.

> **Trabalho de Graduação (TG)** · Análise e Desenvolvimento de Sistemas · FATEC Itu · 2026

## Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Regras de negócio principais](#regras-de-negócio-principais)
- [Perfis de acesso e segurança](#perfis-de-acesso-e-segurança)
- [Tecnologias](#tecnologias)
- [Arquitetura e estrutura](#arquitetura-e-estrutura)
- [Pré-requisitos](#pré-requisitos)
- [Como executar](#como-executar)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Testes e qualidade](#testes-e-qualidade)
- [Documentação complementar](#documentação-complementar)
- [Contexto acadêmico](#contexto-acadêmico)
- [Licença](#licença)

## Sobre o projeto

O CCZ de Itu gerencia o canil e os processos de zoonoses com fichas de papel, etiquetas físicas de vacinas e planilhas
Excel com várias abas. Isso fragmenta os dados, faz os reforços vacinais dependerem da memória da equipe e impede
indicadores automáticos.

O SISZOO reúne essas informações em um único sistema, de uso **exclusivamente interno** pelos servidores do CCZ (não há
portal para o cidadão). Três restrições do ambiente real orientaram o projeto:

- computadores com cerca de **2 GB de RAM**, o que exige uma aplicação leve;
- **internet instável**, por isso os formulários guardam rascunho local e não perdem o que foi digitado;
- acesso **apenas pelo navegador**.

## Funcionalidades

### Animais e canil

- Cadastro e edição de animais com microchip, número da medalha, procedência, foto e anexos (JPG, PNG ou PDF).
- Gestão de baias com ocupação, residentes e bloqueio de alocação em baia sem vaga.
- Histórico clínico com vacinações, procedimentos, prescrições e exames. Os registros são imutáveis: uma correção é um
  novo registro que retifica o anterior.
- Catálogo de medicamentos e categorias farmacológicas.
- Alertas de reforço vacinal com 7 dias de antecedência.
- Laudo obrigatório ao registrar óbito por eutanásia.

### Ocorrências e denúncias

- Registro com protocolo anual gerado pelo sistema, endereço com preenchimento por CEP (ViaCEP) e filtros por tipo,
  status, texto e período.
- Denunciante anônimo ou sigiloso. Os dados sigilosos são mascarados no servidor para quem não tem permissão.
- Anexos, notas, mudança de status e encerramento com a providência tomada.
- Abertura de processo sanitário a partir de uma ocorrência.

### Processos sanitários

- Processos de zoonoses com animais amostrados, sintomas e números GAL e SINAN informados manualmente.
- Resultado laboratorial imutável. O resultado positivo é definitivo.
- Processos com contato humano-animal marcados como urgentes.
- E-mail automático ao munícipe quando o resultado é positivo ou inconclusivo, com reenvio manual.

### Dashboard e relatórios

- Indicadores e gráficos calculados no servidor, com cache de 5 minutos.
- Seis relatórios com prévia na tela e exportação em PDF ou CSV: anual de processos, vacinação, adoções, procedimentos,
  ocupação de baias e ocorrências por bairro.
- Histórico das exportações realizadas.

### Usuários, acesso e auditoria

- Login com token JWT e troca de senha obrigatória no primeiro acesso.
- Política de senha aplicada na criação e na troca.
- Cadastro, ativação e desativação de usuários, perfil próprio e preferências.
- Trilha de auditoria consultável e filtrável pelo Administrador.

### Formulários resilientes

- Rascunho automático em IndexedDB nos formulários de animal, ocorrência, processo, registros clínicos e baia. O
  rascunho é separado por usuário, vale por 7 dias e guarda também os anexos.
- Aviso quando a conexão cai, para que o envio seja refeito depois.

### Limitações conhecidas

- O relatório de adoções é um retrato dos animais por status. O cartão "Adoções no mês" do dashboard exibe dados de
  demonstração, sinalizados na tela.
- A notificação à Vigilância Epidemiológica não envia e-mail, só registra no log.
- Não há data de saída do animal: a saída é registrada pela mudança de status.
- Usuários podem ser ativados ou desativados, mas não editados por outra pessoa.
- A busca global da barra superior ainda não tem efeito.
- Os catálogos de vacinas e de tipos de procedimento são fixos no frontend.

### Trabalhos futuros

Modelados na documentação, mas **não implementados** nesta versão:

- adoção completa (adotante, devolução e permanência);
- documento PDF do processo sanitário;
- anexos por registro clínico (vacinação, procedimento e exame);
- testes de ponta a ponta (E2E).

## Regras de negócio principais

- **Identificação:** microchip e número da medalha são únicos quando informados. O microchip não muda depois de definido.
- **Protocolo:** ocorrências e processos recebem protocolo `NNN/AAAA`, sequencial por ano e por tipo.
- **Imutabilidade:** registros clínicos e resultados laboratoriais nunca são editados nem excluídos. A correção é um novo
  registro, com auditoria.
- **Sigilo (LGPD):** cada acesso aos dados de um denunciante sigiloso, e cada recusa, gera evento de auditoria.
- **Urgência:** processos com contato humano-animal aparecem no topo das listagens.

O conjunto completo está em [docs/DER.md](docs/DER.md) (§5) e em
[docs/regras-negocio-clinico.md](docs/regras-negocio-clinico.md).

## Perfis de acesso e segurança

As permissões ficam no banco e são definidas pelas migrations do Flyway:

| Perfil | Acesso concedido |
|---|---|
| **Administrador** | Todos os módulos: usuários e auditoria, animais e clínico, ocorrências (inclusive o denunciante sigiloso), processos sanitários e relatórios. É o único que desativa baias e medicamentos. |
| **Veterinário** | Animais, baias e histórico clínico (leitura e escrita), processos sanitários (leitura e escrita) e relatórios. Não acessa ocorrências nem usuários. |
| **Agente Sanitário** | Ocorrências e denúncias (leitura e escrita, inclusive o denunciante sigiloso), processos sanitários (leitura e escrita), animais (somente leitura) e relatórios. |

A API não exclui registros fisicamente: baias, medicamentos e usuários são desativados.

- A autenticação é stateless, com token JWT de 60 minutos, sem refresh token e sem cookies.
- As permissões são relidas do banco a cada requisição. Uma mudança de perfil ou a desativação de um usuário vale na
  hora, inclusive para tokens já emitidos.
- A política de senha está em [docs/decisoes/politica-senha.md](docs/decisoes/politica-senha.md).

## Tecnologias

| Camada | Tecnologias |
|---|---|
| **Backend** | Java 21, Spring Boot 4 (Web MVC, Data JPA, Security, Validation, Mail, Cache), Caffeine, Thymeleaf, JJWT, MapStruct, Lombok, Flying Saucer + OpenPDF (PDF), Maven Wrapper |
| **Frontend** | React 19, TypeScript 6, Vite 8, React Router 7, TanStack Query 5, React Hook Form + Zod 4, Axios, Recharts 3, idb (IndexedDB) |
| **Banco de dados** | PostgreSQL 16, migrations versionadas com Flyway |
| **Testes e qualidade** | JUnit, Testcontainers, REST Assured, GreenMail, Vitest 4, Testing Library, MSW, oxlint |
| **Infraestrutura** | Docker e Docker Compose, nginx (imagem do frontend), GitHub Actions |

## Arquitetura e estrutura

O frontend é uma SPA em React que consome a API REST do backend (`/api`). O backend, em Spring Boot, persiste no
PostgreSQL e gera os PDFs dos relatórios. Ele é organizado por funcionalidade: cada pacote tem seus controllers,
services, repositories, entidades e DTOs. O frontend segue a mesma divisão em `src/features`.

```text
SISZOO/
├── backend/                     # API REST (Spring Boot)
│   └── src/
│       ├── main/java/com/siszoo/
│       │   ├── usuarios/        # autenticação, usuários, preferências e auditoria
│       │   ├── animais/         # animais, baias e histórico clínico (animais/clinico)
│       │   ├── ocorrencias/     # ocorrências e denúncias
│       │   ├── processos/       # processos sanitários e notificações
│       │   ├── relatorios/      # dashboard e relatórios PDF/CSV
│       │   ├── alertas/         # alertas de reforço vacinal
│       │   └── comum/           # configuração, segurança, erros, anexos e health check
│       ├── main/resources/
│       │   ├── db/migration/    # migrations do Flyway
│       │   └── templates/       # templates de e-mail e de relatórios (Thymeleaf)
│       └── test/                # testes unitários e de integração
├── frontend/                    # SPA (React + Vite)
│   └── src/
│       ├── features/            # uma pasta por área (api, components, hooks, schemas)
│       ├── components/          # componentes compartilhados e layout
│       ├── lib/                 # cliente HTTP, rascunhos, perfis e utilitários
│       └── routes/              # rotas e controle de acesso por perfil
├── docs/                        # modelagem, decisões, contratos, protótipo e TG
├── scripts/                     # seed de dados fictícios
├── .insomnia/                   # coleção de requisições da API
├── docker-compose.yml           # PostgreSQL + backend + frontend
└── .env.example                 # modelo de variáveis de ambiente
```

## Pré-requisitos

- **Para subir tudo com Docker:** Docker com Docker Compose.
- **Para desenvolver:**
  - Java 21;
  - Node.js 22.22.2+ (linha 22), 24.15+ (linha 24) ou 26+;
  - PostgreSQL 16 (o serviço `db` do Compose basta).
- O Maven não precisa ser instalado: o projeto inclui o Maven Wrapper.
- Os testes de integração do backend também precisam de Docker (Testcontainers).

## Como executar

```bash
git clone https://github.com/IsaqueBatist/SISZOO.git
cd SISZOO
cp .env.example .env
```

Antes de subir, edite o `.env`:

- **`JWT_SECRET`:** gere uma chave própria, com pelo menos 32 bytes. Sem ela, o backend não inicia.
- **`ADMIN_SEED_PASSWORD`:** defina a senha do primeiro Administrador.

```bash
openssl rand -base64 48
```

```powershell
# alternativa no PowerShell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
```

### Opção A — Docker Compose

```bash
docker compose up --build
```

| Serviço | Endereço |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:8080 (health check em `/api/health`) |
| PostgreSQL | `localhost:5432` |

O backend aplica as migrations ao iniciar e cria o Administrador definido em `ADMIN_SEED_EMAIL` e
`ADMIN_SEED_PASSWORD`. No primeiro login, o sistema pede a troca dessa senha.

### Opção B — desenvolvimento local

**1. Banco de dados.** Suba só o PostgreSQL do Compose, ou use uma instalação local com um banco `siszoo`:

```bash
docker compose up -d db
```

**2. Backend.** O perfil `dev` é obrigatório, porque é ele que lê as variáveis de conexão. As migrations são aplicadas
ao iniciar.

```bash
cd backend
export DB_URL=jdbc:postgresql://localhost:5432/siszoo
export DB_USER=postgres
export DB_PASSWORD=postgres
export JWT_SECRET="<chave gerada acima>"
export ADMIN_SEED_EMAIL=admin.sistema@itu.sp.gov.br
export ADMIN_SEED_PASSWORD="<senha do primeiro administrador>"
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Se o shell recusar `./mvnw` por falta de permissão de execução, `sh mvnw` funciona igual. No PowerShell, defina as
variáveis com `$env:NOME = "valor"` e rode `.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"`.

**3. Frontend.**

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

O frontend abre em http://localhost:5173 e usa a API indicada em `VITE_API_BASE_URL`.

### Dados fictícios (opcional)

Com o PostgreSQL no ar e as migrations já aplicadas (suba o backend ao menos uma vez), rode na raiz do repositório:

```bash
npm install
npm run db:seed
```

O seed grava direto no banco: usuários dos três perfis, baias, animais, histórico clínico, ocorrências e processos. Ele
é idempotente, ou seja, rodar de novo não duplica nada. Ao final, imprime os e-mails e a senha dos usuários de teste.

> **LGPD:** nunca versione dados reais de munícipes, denunciantes ou animais. Use apenas dados fictícios em seeds e
> fixtures.

## Variáveis de ambiente

O modelo completo, com valores fictícios, está em [.env.example](.env.example) (raiz) e em
[frontend/.env.example](frontend/.env.example).

| Variável | Uso | Obrigatória |
|---|---|---|
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Banco criado pelo serviço `db` do Compose; também lidas pelo seed | Não (padrão `siszoo`/`postgres`/`postgres`) |
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | Conexão do backend com o PostgreSQL | Sim |
| `JWT_SECRET` | Chave de assinatura dos tokens, com 32 bytes ou mais | Sim |
| `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` | Administrador criado na primeira inicialização. O e-mail precisa ser institucional: letras minúsculas e pontos antes de `@itu.sp.gov.br` | Para o primeiro acesso |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_AUTH`, `SMTP_STARTTLS`, `SMTP_STARTTLS_REQUIRED`, `SMTP_SSL`, `SISZOO_MAIL_FROM` | Envio de e-mail ao munícipe. Sem SMTP, a falha de envio só é registrada no log. Em desenvolvimento, use um SMTP sandbox, nunca uma caixa real. Detalhes em [docs/email.md](docs/email.md) | Não |
| `SISZOO_CORS_ORIGIN` | Única origem do frontend aceita pela API (CORS). Ajuste se o frontend for servido em outro endereço | Não (padrão `http://localhost:5173`) |
| `VITE_API_BASE_URL` | Endereço da API usado pelo frontend, definido no build | Não (padrão `http://localhost:8080`) |
| `VITE_USE_MOCK_KPIS`, `VITE_USE_MOCK_GRAFICOS` | Indicadores e gráficos de exemplo, para trabalhar no frontend sem backend | Ver abaixo |
| `SEED_DB_HOST`, `SEED_DB_PORT` | Host e porta do banco usados pelo seed | Não (padrão `localhost`/`5432`) |

As flags `VITE_USE_MOCK_*` só usam dados reais quando valem exatamente `false`. Se estiverem ausentes, o frontend exibe
dados de exemplo. O [frontend/.env.example](frontend/.env.example) já traz `false`, e a imagem Docker do frontend é
construída com `false` por padrão.

## Testes e qualidade

**Backend** (em `backend/`):

```bash
./mvnw test     # testes unitários
./mvnw verify   # unitários + integração (*IT), com PostgreSQL via Testcontainers (exige Docker)
```

**Frontend** (em `frontend/`):

```bash
npm run lint     # oxlint
npm run test     # Vitest, com a API simulada pelo MSW
npm run build    # checagem de tipos (tsc) + build de produção
```

O [workflow de CI](.github/workflows/ci.yml) roda `mvnw verify` e lint, testes e build do frontend em cada push e pull
request para `main`.

Para testes manuais, há a coleção do Insomnia em `.insomnia/` ([instruções](docs/insomnia/README.md)) e o
[roteiro de testes manuais](docs/roteiro-testes-manuais.md).

## Documentação complementar

| Documento | Conteúdo |
|---|---|
| [docs/README.md](docs/README.md) | Índice da documentação e regras de manutenção |
| [docs/DER.md](docs/DER.md) | Modelo de dados completo e regras de negócio numeradas |
| [docs/regras-negocio-clinico.md](docs/regras-negocio-clinico.md) | Regras de vacinação, procedimentos, prescrições, exames e alertas |
| [docs/email.md](docs/email.md) | Configuração de SMTP, sandbox e notificações |
| [docs/decisoes/](docs/decisoes/) | Registro das decisões de implementação |
| [docs/contratos/](docs/contratos/) | Contratos de endpoints entre frontend e backend |
| [docs/prototipo/](docs/prototipo/) | Protótipo navegável e design system |
| [docs/roteiro-testes-manuais.md](docs/roteiro-testes-manuais.md) | Roteiro de testes manuais por área |
| [docs/tg/README.md](docs/tg/README.md) | Material do Trabalho de Graduação e análises de alinhamento com o código |

## Contexto acadêmico

O SISZOO é o Trabalho de Graduação (TG) do curso de Análise e Desenvolvimento de Sistemas da FATEC Itu, desenvolvido
em 2026 para o CCZ de Itu.

- **Autores:** Beatriz Silva de Camargo e Isaque Batista Barbosa
- **Orientador:** Prof. Me. Francisco Bianchi

## Licença

Distribuído sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE).
